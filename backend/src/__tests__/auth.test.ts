import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

describe('NexMart Authentication & Authorization Suite', () => {
  const timestamp = Date.now();
  const testCustomerEmail = `customer_${timestamp}@test.com`;
  const testVendorEmail = `vendor_${timestamp}@test.com`;
  const testPassword = 'Password@123';

  let customerAccessToken: string;
  let customerRefreshToken: string;
  let vendorAccessToken: string;
  let adminAccessToken: string;

  beforeAll(async () => {
    await connectDB();
    let admin = await User.findOne({ email: 'admin@nexmart.com' });
    if (!admin) {
      admin = new User({
        name: 'Platform Admin',
        email: 'admin@nexmart.com',
        passwordHash: 'Admin@12345',
        role: 'ADMIN',
        isActive: true
      });
    } else {
      admin.passwordHash = 'Admin@12345';
      admin.role = 'ADMIN' as any;
      admin.isActive = true;
    }
    await admin.save();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Input Validation & Registration', () => {
    it('should reject registration with invalid input (missing fields, weak password)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully register a new customer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Customer',
          email: testCustomerEmail,
          password: testPassword,
          role: 'CUSTOMER',
          phone: '9876543210'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testCustomerEmail.toLowerCase());
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose hash
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      customerAccessToken = res.body.data.accessToken;
      customerRefreshToken = res.body.data.refreshToken;
    });

    it('should prevent self-registration as ADMIN (security role escalation protection)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Admin',
          email: `fakeadmin_${timestamp}@test.com`,
          password: testPassword,
          role: 'ADMIN'
        });

      expect(res.status).toBe(201);
      // System overrides role to CUSTOMER
      expect(res.body.data.user.role).toBe('CUSTOMER');
    });

    it('should prevent duplicate registration with the same email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Duplicate',
          email: testCustomerEmail,
          password: testPassword
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should successfully register a vendor account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Vendor Owner',
          email: testVendorEmail,
          password: testPassword,
          role: 'VENDOR',
          phone: '9123456780'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('VENDOR');
      vendorAccessToken = res.body.data.accessToken;
    });
  });

  describe('2. Login & Authentication Flow', () => {
    it('should fail login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: 'WrongPassword@999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail login with non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: `nonexistent_${timestamp}@test.com`,
          password: testPassword
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully login customer and return valid JWT tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomerEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testCustomerEmail.toLowerCase());
      customerAccessToken = res.body.data.accessToken;
    });

    it('should successfully login as seeded platform admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@nexmart.com',
          password: process.env.ADMIN_PASSWORD || 'Admin123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('ADMIN');
      adminAccessToken = res.body.data.accessToken;
    });
  });

  describe('3. Protected Routes & Session Handling', () => {
    it('should return profile for authenticated user on GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testCustomerEmail.toLowerCase());
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should reject unauthenticated request without token (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid or malformed token (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_malformed_token_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully refresh access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: customerRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should successfully logout and clear session cookies', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Role-Based Access Control (RBAC)', () => {
    it('should DENY customer access to admin dashboard (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });

    it('should DENY customer access to vendor dashboard (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/vendor/dashboard')
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should DENY vendor access to admin dashboard (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${vendorAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should DENY unauthenticated user access to admin dashboard (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('should DENY unauthenticated user access to customer orders (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });

    it('should ALLOW platform admin access to admin dashboard (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
