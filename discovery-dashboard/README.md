## Camunda AI Decision Gateway Discovery Dashboard

This application connects to a Camunda ElasticSearch (ES) cluster and converts usertask completion data into a machine learnable format

### Configuring the Elasticsearch Connection

- Make a copy of the .env file and name it .env.local
- Ensure that the `ES_ENDPOINT` points to your ES cluster
- Uncomment the lines that make sense for your environment to configure the connection and authentication:
- For TLS configuration via CA_CERT and CA Fingerprint, see https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-connecting.html#connect-self-managed-new
- The `ES_CA_CERT_PATH` is relative to the root directory (so if the cert file is in the same directory as the .env.local file, it should be `./http_ca.crt`)
- For the Authentication strategies, see https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-connecting.html#auth-strategies

If you have trouble connecting to Elasticsearch, check out `src/app/utils.js`. This is where the ES connection is configured. Feel free to make adjustments and send a Pull Request if you encounter any issues with a specific setup.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
