/**
 * Manual test script to execute a ping job
 * Usage: npx ts-node test-ping.ts <monitorId>
 */

import "dotenv/config";
import { executePingJob } from "./src/cron/pingJob";

const monitorId = process.argv[2] ? parseInt(process.argv[2]) : 1;

if (isNaN(monitorId)) {
  console.error("Invalid monitor ID. Usage: npx ts-node test-ping.ts <monitorId>");
  process.exit(1);
}

console.log(`Executing ping job for monitor ${monitorId}...`);

executePingJob(monitorId)
  .then(() => {
    console.log("Ping job completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Ping job failed:", error);
    process.exit(1);
  });

