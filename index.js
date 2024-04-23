const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: 'http://localhost:9200'
});

(async () => {
    const variableResult = await client.search({
        index: 'zeebe-record-variable',
        size: 10000
    });
    const historyResult = await client.search({
        index: 'zeebe-record-process-instance',
        size: 10000
    });

    let aggregate = variableResult.hits.hits.reduce((acc, curr) => {
        if (!acc[curr._source.partitionId]) {
            acc[curr._source.partitionId] = []
        }

        acc[curr._source.partitionId].push(curr);

        return acc;
    }, {});
    aggregate = historyResult.hits.hits.reduce((acc, curr) => {
        if (!acc[curr._source.partitionId]) {
            acc[curr._source.partitionId] = []
        }

        acc[curr._source.partitionId].push(curr);

        return acc;
    }, aggregate);


    Object.values(aggregate).forEach(list => {
        list.sort((a, b) => a._source.position - b._source.position);
    });

    const byProcessInstance = {};
    Object.values(aggregate).forEach(list => {
        list.reduce((acc, curr) => {
            if (!acc[curr._source.value.processInstanceKey]) {
                acc[curr._source.value.processInstanceKey] = []
            }

            acc[curr._source.value.processInstanceKey].push(curr._source);

            return acc;
        }, byProcessInstance);
    })


    console.log(byProcessInstance);
})();