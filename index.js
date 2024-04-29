const { Client } = require("@elastic/elasticsearch");

const client = new Client({
  node: "http://localhost:9200",
});

(async () => {
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
  Object.values(byProcessInstance).forEach((processInstance) => {
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
          };
        }
        if (event.event.intent === "ELEMENT_COMPLETED") {
          currentTask.after = { ...variables };
          if (!byProcessDefinition[definition][event.event.value.elementId]) {
            byProcessDefinition[definition][event.event.value.elementId] = [];
          }
          byProcessDefinition[definition][event.event.value.elementId].push(
            currentTask
          );
        }
      }
    }
  });

  const processKey = process.argv[2];
  const taskId = process.argv[3];

  if (processKey && taskId) {
    const entries = byProcessDefinition[processKey][taskId].map((e) => e.after);

    const keys = Object.keys(entries[0]);
    const values = entries.map((entry) => keys.map((key) => entry[key]));

    const csv =
      keys.join(",") + "\n" + values.map((value) => value.join(",")).join("\n");

    console.log(csv);
  }
})();
