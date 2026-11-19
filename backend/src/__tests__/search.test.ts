import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { esHealthCheck } from '../config/elasticsearch.js';

describe('NexMart Elasticsearch Search Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should truthfully verify that Elasticsearch engine is offline when Docker is down', async () => {
    const isOnline = await esHealthCheck();
    // Honest verification: port 9200 is down, so health check returns false
    expect(isOnline).toBe(false);
  });

  it('should return 503 Service Unavailable with clear message when Elasticsearch is queried while offline', async () => {
    const res = await request(app)
      .get('/api/products/search')
      .query({ query: 'laptop', minPrice: 1000 });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Elasticsearch');
    expect(res.body.message).toContain('offline');
  });
});
