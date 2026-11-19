import { Client } from '@elastic/elasticsearch';
import env from './env.js';

let esClient: Client | null = null;
let isEsAvailable = false;

try {
  const clientOptions: any = {
    node: env.ELASTICSEARCH_URL,
    maxRetries: 2,
    requestTimeout: 3000
  };

  if (env.ELASTICSEARCH_USERNAME && env.ELASTICSEARCH_PASSWORD) {
    clientOptions.auth = {
      username: env.ELASTICSEARCH_USERNAME,
      password: env.ELASTICSEARCH_PASSWORD
    };
  }

  esClient = new Client(clientOptions);
} catch (error: any) {
  console.warn('[Elasticsearch] Initialization error:', error.message);
  esClient = null;
}

export const getElasticsearchClient = (): Client | null => {
  return esClient;
};

export const esHealthCheck = async (): Promise<boolean> => {
  if (!esClient) return false;
  try {
    const health = await esClient.cluster.health({});
    isEsAvailable = !!health;
    return isEsAvailable;
  } catch (error) {
    isEsAvailable = false;
    return false;
  }
};
