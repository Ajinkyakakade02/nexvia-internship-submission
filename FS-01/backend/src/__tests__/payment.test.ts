import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import prisma from '../config/prisma.js';
import { OrderStatus, PaymentStatus, UserRole } from '../types/index.js';
import { toDecimal } from '../utils/prismaSerializer.js';

describe('NexMart Payment Gateway & Commission Suite', () => {
  let customerToken: string;
  let customerId: string;
  let vendorProfileId: string;
  let testOrderId: string;
  const testAmount = 1500;
  const timestamp = Date.now();

  beforeAll(async () => {
    await prisma.$connect();

    const passwordHash = await bcrypt.hash('Password@123', 10);

    // 1. Create Customer
    const customer = await prisma.user.create({
      data: {
        name: 'Payment Test Customer',
        email: `pay_customer_${timestamp}@test.com`,
        passwordHash,
        role: UserRole.CUSTOMER,
        phone: '9988776655'
      }
    });
    customerId = customer.id;

    // Login customer to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: customer.email, password: 'Password@123' });
    customerToken = loginRes.body.data.accessToken;

    // 2. Create Vendor User & Profile
    const vendorUser = await prisma.user.create({
      data: {
        name: 'Payment Test Vendor',
        email: `pay_vendor_${timestamp}@test.com`,
        passwordHash,
        role: UserRole.VENDOR,
        phone: '9988776644'
      }
    });

    const vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId: vendorUser.id,
        storeName: `Pay Store ${timestamp}`,
        slug: `pay-store-${timestamp}`,
        businessEmail: vendorUser.email,
        businessPhone: '9988776644',
        commissionRate: toDecimal(10)
      }
    });
    vendorProfileId = vendorProfile.id;

    // 3. Create Category & Product
    const category = await prisma.category.create({
      data: {
        name: `Pay Category ${timestamp}`,
        slug: `pay-cat-${timestamp}`,
        isActive: true
      }
    });

    const product = await prisma.product.create({
      data: {
        vendorId: vendorProfile.id,
        categoryId: category.id,
        name: `Test Product ${timestamp}`,
        slug: `test-prod-${timestamp}`,
        description: 'Test product for payment gateway verification',
        price: toDecimal(1500),
        stock: 50,
        status: 'ACTIVE'
      }
    });

    // 4. Create Order with VendorOrder
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-PAY-${timestamp}`,
        customerId: customer.id,
        shippingAddressSnapshot: {
          fullName: 'Pay Customer',
          phone: '9988776655',
          street: '123 Market St',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        },
        subtotal: toDecimal(1500),
        discount: toDecimal(0),
        shippingCost: toDecimal(0),
        tax: toDecimal(0),
        total: toDecimal(testAmount),
        paymentStatus: PaymentStatus.PENDING,
        overallStatus: OrderStatus.PLACED,
        vendorOrders: {
          create: [
            {
              vendorId: vendorProfile.id,
              subtotal: toDecimal(1500),
              status: OrderStatus.PLACED,
              items: {
                create: [
                  {
                    productId: product.id,
                    productName: product.name,
                    price: toDecimal(1500),
                    quantity: 1,
                    subtotal: toDecimal(1500)
                  }
                ]
              }
            }
          ]
        }
      }
    });
    testOrderId = order.id;
  });

  afterAll(async () => {
    try {
      if (testOrderId) {
        await prisma.commission.deleteMany({ where: { orderId: testOrderId } });
        await prisma.payment.deleteMany({ where: { orderId: testOrderId } });
        await prisma.vendorOrderItem.deleteMany({
          where: { vendorOrder: { orderId: testOrderId } }
        });
        await prisma.vendorOrder.deleteMany({ where: { orderId: testOrderId } });
        await prisma.order.deleteMany({ where: { id: testOrderId } });
      }
      if (vendorProfileId) {
        await prisma.product.deleteMany({ where: { vendorId: vendorProfileId } });
        await prisma.vendorProfile.deleteMany({ where: { id: vendorProfileId } });
      }
      await prisma.user.deleteMany({
        where: { email: { in: [`pay_customer_${timestamp}@test.com`, `pay_vendor_${timestamp}@test.com`] } }
      });
      await prisma.category.deleteMany({ where: { slug: `pay-cat-${timestamp}` } });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('1. Payment Order Initialization', () => {
    it('should initialize a payment order (test mode / simulation) with proper amounts and tracking', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrderId,
          amount: testAmount,
          currency: 'INR'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.razorpayOrderId).toBeDefined();
      expect(res.body.data.amount).toBe(testAmount * 100); // 150000 paise
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.data.mode).toBeDefined(); // 'simulation' or 'razorpay'

      // Check payment record created in pending state
      const payment = await prisma.payment.findFirst({ where: { orderId: testOrderId } });
      expect(payment).toBeDefined();
      expect(payment?.status).toBe(PaymentStatus.PENDING);
    });

    it('should reject payment initialization for a non-existent order', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: fakeId,
          amount: 500
        });

      expect(res.status).toBe(404);
    });
  });

  describe('2. Payment Verification & Duplicate Protection', () => {
    it('should capture payment, update order status to COMPLETED, and record commissions', async () => {
      const payment = await prisma.payment.findFirst({ where: { orderId: testOrderId } });
      expect(payment).toBeDefined();

      const simPaymentId = `pay_sim_${Date.now()}`;
      const simSignature = 'sim_sig_valid';

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrderId,
          razorpayOrderId: payment?.razorpayOrderId,
          razorpayPaymentId: simPaymentId,
          razorpaySignature: simSignature
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.status).toBe(PaymentStatus.COMPLETED);

      // Verify order status updated in database
      const updatedOrder = await prisma.order.findUnique({ where: { id: testOrderId } });
      expect(updatedOrder?.paymentStatus).toBe(PaymentStatus.COMPLETED);

      // Verify commission calculated and recorded for vendor
      const commission = await prisma.commission.findFirst({
        where: { orderId: testOrderId, vendorId: vendorProfileId }
      });
      expect(commission).toBeDefined();
      expect(Number(commission?.grossAmount)).toBe(1500);
      // Default platform commission is 10%: 150, Vendor net: 1350
      expect(Number(commission?.commissionPercent)).toBe(10);
      expect(Number(commission?.commissionAmount)).toBe(150);
      expect(Number(commission?.vendorNetAmount)).toBe(1350);
    });

    it('should enforce duplicate protection (idempotency) when verifying already completed payment', async () => {
      const payment = await prisma.payment.findFirst({ where: { orderId: testOrderId } });

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrderId,
          razorpayOrderId: payment?.razorpayOrderId,
          razorpayPaymentId: 'pay_sim_duplicate',
          razorpaySignature: 'sim_sig_valid'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('already completed');

      // Verify no duplicate commissions were created
      const commissionCount = await prisma.commission.count({ where: { orderId: testOrderId } });
      expect(commissionCount).toBe(1);
    });
  });
});
