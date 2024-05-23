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

  const processKey = process.argv[2];
  const taskId = process.argv[3];

  if (processKey && taskId) {
    const entries = byProcessDefinition[processKey][taskId];

    let inputs = new Set();
    let outputs = new Set();

    entries.forEach(({ before, after }) => {
      const inKeys = Object.keys(before);
      inKeys.forEach((inkey) => {
        inputs.add(inkey);
      });
      const outkeys = Object.keys(after);
      outkeys.forEach((outkey) => {
        if (before[outkey] !== after[outkey]) {
          outputs.add(outkey);
        }
      });
    });

    inputs = Array.from(inputs);
    outputs = Array.from(outputs);

    const keys = [
      "Process Instance Key",
      "StartTime",
      "EndTime",
      ...inputs.map((key) => "Input: " + key),
      ...outputs.map((key) => "Output: " + key),
    ];
    const values = entries.map(
      ({ before, after, processInstanceId, start, end }) => [
        processInstanceId,
        new Date(start).toISOString(),
        new Date(end).toISOString(),
        ...inputs.map((key) => before[key]),
        ...outputs.map((key) => after[key]),
      ]
    );

    const csv =
      keys.join(",") + "\n" + values.map((value) => value.join(",")).join("\n");

    console.log(csv);
  }
})();
