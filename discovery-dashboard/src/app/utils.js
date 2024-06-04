import { cache } from "react";
import { Client } from "@elastic/elasticsearch";
import BpmnModdle from "bpmn-moddle";

const client = new Client({
  node: "http://localhost:9200",
});

let resultCache;

async function search(index) {
  const out = [];
  let lastSearch = null;

  while (1) {
    const args = {
      index,
      sort: [{ position: "asc" }],
      size: 9999,
    };
    if (lastSearch) {
      args.search_after = lastSearch;
    }

    const result = await client.search(args);

    if (result.hits.hits.length) {
      out.push(result.hits.hits);
      lastSearch = result.hits.hits[result.hits.hits.length - 1].sort;
    } else {
      break;
    }
  }

  return out.flat();
}

export const getList = cache(async () => {
  if (resultCache) {
    return resultCache;
  }

  const variableResult = await search("zeebe-record-variable");
  const historyResult = await search("zeebe-record-process-instance");
  const processResult = await search("zeebe-record-process");

  const processes = {};

  for (let i = 0; i < processResult.length; i++) {
    const entry = processResult[i];

    const moddle = new BpmnModdle();
    const parsed = await moddle.fromXML(atob(entry._source.value.resource));

    let processName = "";
    const tasks = {};
    Object.entries(parsed.elementsById).forEach(([key, value]) => {
      tasks[key] = value.name || value.id;

      if (value.$type === "bpmn:Process") {
        processName = value.name || value.id;
      }
    });

    processes[entry._source.value.processDefinitionKey] = {
      tasks,
      name: processName,
      version: entry._source.value.version,
    };
  }

  let aggregate = variableResult.reduce((acc, curr) => {
    if (!acc[curr._source.partitionId]) {
      acc[curr._source.partitionId] = [];
    }

    acc[curr._source.partitionId].push({ type: "variable", event: curr });

    return acc;
  }, {});
  aggregate = historyResult.reduce((acc, curr) => {
    if (!acc[curr._source.partitionId]) {
      acc[curr._source.partitionId] = [];
    }

    acc[curr._source.partitionId].push({ type: "history", event: curr });

    return acc;
  }, aggregate);

  Object.values(aggregate).forEach((list) => {
    list.sort((a, b) => a.event._source.position - b.event._source.position);
  });

  const byProcessInstance = {};
  Object.values(aggregate).forEach((list) => {
    list.reduce((acc, curr) => {
      if (!acc[curr.event._source.value.processInstanceKey]) {
        acc[curr.event._source.value.processInstanceKey] = [];
      }

      acc[curr.event._source.value.processInstanceKey].push({
        event: curr.event._source,
        type: curr.type,
      });

      return acc;
    }, byProcessInstance);
  });

  const byProcessDefinition = {};

  Object.entries(byProcessInstance).forEach(
    ([processInstanceId, processInstance]) => {
      const variables = {};

      const definition = processInstance[0].event.value.processDefinitionKey;
      let currentTask;
      if (!byProcessDefinition[definition]) {
        byProcessDefinition[definition] = {};
      }
      for (let i = 0; i < processInstance.length; i++) {
        const event = processInstance[i];

        if (event.type === "variable") {
          variables[event.event.value.name] = event.event.value.value;
        }

        if (event.type === "history") {
          if (event.event.intent === "ELEMENT_ACTIVATING") {
            currentTask = {
              before: { ...variables },
              processInstanceId,
              start: event.event.timestamp,
            };
          }
          if (event.event.intent === "ELEMENT_COMPLETED" && currentTask) {
            currentTask.after = { ...variables };
            currentTask.end = event.event.timestamp;
            if (!byProcessDefinition[definition][event.event.value.elementId]) {
              byProcessDefinition[definition][event.event.value.elementId] = [];
            }
            byProcessDefinition[definition][event.event.value.elementId].push(
              currentTask
            );
          }
        }
      }
    }
  );

  resultCache = {
    data: byProcessDefinition,
    labels: processes,
  };

  return resultCache;
});
