# External Credentials & Production Setup Guide
# Organization: Nexvia Technologies Private Limited
# Project: FS-01 — NexMart Multi-Vendor E-Commerce Platform

This document outlines all external cloud integrations, how their local simulation modes work out-of-the-box, and exact instructions for connecting real credentials in production.

---

## 1. Credentials Checklist

| Service | Environment Variable(s) | Status in Local Dev | Production Provider |
|---|---|---|---|
| **Database** | `MONGODB_URI` | Supported via local MongoDB (`mongodb://localhost:27017/fs01_marketplace`) | MongoDB Atlas (Cluster M0 or dedicated) |
| **Caching** | `REDIS_URL` | Graceful bypass if offline | Upstash Redis or AWS ElastiCache |
| **Search Engine** | `ELASTICSEARCH_URL` | Graceful fallback to MongoDB regex search | Elastic Cloud or AWS OpenSearch |
| **Payments** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Simulation adapter (`PAYMENT_PROVIDER=simulation`) | Razorpay Test / Live Mode Keys |
| **Route Transfers** | `RAZORPAY_ACCOUNT_NUMBER` | Simulated route transfers | Razorpay Route Marketplace activation |
| **File Storage** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | Local disk adapter (`STORAGE_PROVIDER=local`) | AWS S3 Bucket with CORS enabled |

---

## 2. Step-by-Step Production Credential Configuration

### A. MongoDB Atlas Setup
1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a new free cluster (M0) in `ap-south-1` (Mumbai).
3. Under **Database Access**, create a user with read-write permissions.
4. Under **Network Access**, allow access from your deployment IP (or `0.0.0.0/0`).
5. Copy the connection string into `.env`:
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/nexmart?retryWrites=true&w=majority
   ```

---

### B. Razorpay Test Mode & Route Setup
1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Switch toggle to **Test Mode**.
3. Navigate to **Settings → API Keys → Generate Key**.
4. Copy `Key Id` and `Key Secret` into `.env`:
   ```bash
   RAZORPAY_KEY_ID=rzp_test_YourKeyHere
   RAZORPAY_KEY_SECRET=YourSecretHere
   PAYMENT_PROVIDER=razorpay
   ```
5. For linked vendor transfers, request **Razorpay Route** enablement under the Marketplace add-ons section in your dashboard.

---

### C. AWS S3 Media Bucket Setup
1. Open the [AWS Console](https://console.aws.amazon.com) and create an S3 bucket (e.g. `nexmart-prod-media`) in `ap-south-1`.
2. Disable "Block all public access" if using direct public object read, or configure a CloudFront distribution.
3. Configure the bucket CORS policy:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
4. Create an IAM user with `AmazonS3FullAccess` and populate `.env`:
   ```bash
   STORAGE_PROVIDER=s3
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET=nexmart-prod-media
   ```

---

### D. Upstash Redis Setup (Zero-Cost Serverless Cache)
1. Sign up at [upstash.com](https://upstash.com).
2. Create a new Redis database in the Mumbai or Singapore region.
3. Copy the `rediss://default:...` connection string into `.env`:
   ```bash
   REDIS_URL=rediss://default:password@region.upstash.io:6379
   ```

---

### E. Elastic Cloud Setup
1. Create a free 14-day trial on [cloud.elastic.co](https://cloud.elastic.co).
2. Create a deployment and copy the HTTPS endpoint and API key into `.env`:
   ```bash
   ELASTICSEARCH_URL=https://your-deployment.es.io:9200
   ELASTICSEARCH_API_KEY=your_base64_key
   ```

