# Testing Guide for Logs System

This guide will help you test all components of the logs system.

## Prerequisites

1. **Database Setup**: Ensure your PostgreSQL database is running and migrations are applied
2. **Environment Variables**: Set up `.env` files for both backend and webworker
3. **Dependencies**: Install dependencies for both backend and webworker

## Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Webworker dependencies
cd ../webworker
npm install
```

## Step 2: Environment Variables

### Backend `.env` (if not already set):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
PORT=5001
WEBWORKER_URL=http://localhost:4001
BACKEND_URL=http://localhost:5001
```

### Webworker `.env` (optional):
```env
PORT=4001
```

## Step 3: Start the Services

### Terminal 1 - Start Backend:
```bash
cd backend
npm run dev
```

### Terminal 2 - Start Webworker:
```bash
cd webworker
npm run dev
```

You should see:
- Backend: `Server listening on http://localhost:5001`
- Backend: `Initializing monitor schedules...`
- Webworker: `Webworker server listening on http://localhost:4001`

## Step 4: Test Webworker Service

### Test Health Endpoint:
```bash
curl http://localhost:4001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "webworker",
  "time": "2024-01-01T00:00:00.000Z"
}
```

### Test Ping Endpoint:
```bash
curl -X POST http://localhost:4001/ping \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "url": "https://www.google.com",
    "isHttps": true
  }'
```

Expected response:
```json
{
  "monitorId": 1,
  "pingMs": 245,
  "statusCode": 200,
  "isUp": true,
  "bodySnippet": "<!doctype html>...",
  "error": null
}
```

### Test Ping with Invalid URL:
```bash
curl -X POST http://localhost:4001/ping \
  -H "Content-Type: application/json" \
  -d '{
    "id": 2,
    "url": "https://invalid-url-that-does-not-exist-12345.com",
    "isHttps": true
  }'
```

Expected: `isUp: false` with an error message.

## Step 5: Test Backend Log Storage

### Test Log Storage Endpoint:
```bash
curl -X POST http://localhost:5001/api/monitors/1/ping \
  -H "Content-Type: application/json" \
  -d '{
    "monitorId": 1,
    "pingMs": 245,
    "statusCode": 200,
    "isUp": true,
    "bodySnippet": "Test response",
    "error": null
  }'
```

**Note**: This requires a monitor with ID 1 to exist in the database. If you don't have one, create it first via the admin panel or API.

## Step 6: Test Full Integration Flow

### 6.1 Create a User and Monitor (via Admin Panel or API)

First, ensure you have:
1. A user account (via Clerk authentication)
2. An active subscription (FREE, PRO, or ENTERPRISE)
3. At least one monitor

### 6.2 Verify Cron Job Scheduling

Check backend logs when you create a monitor. You should see:
```
Scheduled monitor 1 (plan: FREE, interval: 60s, cron: */1 * * * *)
```

### 6.3 Wait for Automatic Ping

After creating a monitor:
- **FREE plan**: Wait 60 seconds
- **PRO plan**: Wait 30 seconds  
- **ENTERPRISE plan**: Wait 30 seconds

Check backend logs for:
```
Ping completed for monitor 1: UP
```

### 6.4 Verify Logs in Database

Query the database to see logs:
```sql
SELECT * FROM "HistoryLog" ORDER BY "createdAt" DESC LIMIT 10;
```

Or use Prisma Studio:
```bash
cd backend
npx prisma studio
```

## Step 7: Test Subscription Limits

### Test Website Limit (FREE plan - max 5):

1. Create 5 monitors (should all succeed)
2. Try to create a 6th monitor (should fail with 403 error)

Expected error:
```json
{
  "error": "Website limit reached",
  "detail": "Your FREE plan allows 5 websites maximum. Please upgrade to add more.",
  "currentCount": 5,
  "maxAllowed": 5
}
```

### Test Different Ping Intervals:

1. Create monitors for users with different plans
2. Verify cron expressions in logs:
   - FREE: `*/1 * * * *` (every minute)
   - PRO: `*/30 * * * * *` (every 30 seconds)
   - ENTERPRISE: `*/30 * * * * *` (every 30 seconds)

## Step 8: Test Monitor Updates

### Test Activating/Deactivating Monitor:

```bash
# Deactivate monitor (should stop cron job)
curl -X PUT http://localhost:5001/api/monitors/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "isActive": false
  }'
```

Check logs: `Stopped monitor 1 ping job`

```bash
# Reactivate monitor (should restart cron job)
curl -X PUT http://localhost:5001/api/monitors/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "isActive": true
  }'
```

Check logs: `Scheduled monitor 1...`

### Test URL Update:

Updating a monitor's URL should reschedule the cron job with the new URL.

## Step 9: Test Monitor Deletion

```bash
curl -X DELETE http://localhost:5001/api/monitors/1 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

Check logs: `Stopped monitor 1 ping job`

## Step 10: Manual Cron Job Test

You can manually trigger a ping job for testing:

Create a test script `backend/test-ping.ts`:
```typescript
import { executePingJob } from "./src/cron/pingJob";

executePingJob(1); // Replace 1 with your monitor ID
```

Run it:
```bash
cd backend
npx ts-node test-ping.ts
```

## Troubleshooting

### Cron jobs not running?
- Check that monitors are `isActive: true`
- Verify user has an active subscription
- Check cron expression format in logs
- Ensure webworker is running and accessible

### Webworker not responding?
- Check webworker is running on port 4001
- Verify CORS settings
- Check webworker logs for errors

### Logs not being stored?
- Verify monitor exists in database
- Check backend logs for errors
- Verify database connection
- Check Prisma client is working

### Subscription limits not enforced?
- Verify `getUserPlan` returns correct plan
- Check subscription status is ACTIVE
- Verify `canAddWebsite` logic

## Quick Test Checklist

- [ ] Webworker health endpoint works
- [ ] Webworker ping endpoint works with valid URL
- [ ] Webworker ping endpoint handles invalid URLs
- [ ] Backend log storage endpoint works
- [ ] Monitor creation schedules cron job
- [ ] Cron jobs execute automatically
- [ ] Logs are stored in database
- [ ] Subscription limits are enforced
- [ ] Monitor deactivation stops cron job
- [ ] Monitor reactivation restarts cron job
- [ ] Monitor deletion stops cron job
- [ ] URL updates reschedule cron job

