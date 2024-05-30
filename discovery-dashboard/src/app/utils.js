import { cache } from "react";
import { Client } from "@elastic/elasticsearch";

const client = new Client({
  node: "http://localhost:9200",
});

export const getList = cache(async () => {
  console.log("performing requests");
  const variableResult = await client.search({
    index: "zeebe-record-variable",
    size: 10000,
  });
  const historyResult = await client.search({
    index: "zeebe-record-process-instance",
    size: 10000,
  });

  let aggregate = variableResult.hits.hits.reduce((acc, curr) => {
    if (!acc[curr._source.partitionId]) {
      acc[curr._source.partitionId] = [];
    }

    acc[curr._source.partitionId].push({ type: "variable", event: curr });

    return acc;
  }, {});
  aggregate = historyResult.hits.hits.reduce((acc, curr) => {
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
          if (event.event.intent === "ELEMENT_COMPLETED") {
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

  return byProcessDefinition;
});
