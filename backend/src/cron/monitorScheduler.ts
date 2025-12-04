import cron from "node-cron";
import { getPingIntervalSeconds } from "../config/appConfiguration";
import prisma from "../prismaClient";
import { getUserPlan } from "../services/subscriptionService";
import { executePingJob } from "./pingJob";

// Map to store active cron jobs: monitorId -> cron task
const activeJobs = new Map<number, cron.ScheduledTask>();

/**
 * Convert seconds to cron expression
 * node-cron supports both 5-field (minute-based) and 6-field (second-based) formats
 * For example: 60 seconds = every minute
 *              30 seconds = every 30 seconds
 */
function secondsToCronExpression(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    // Use 5-field format for minutes: minute hour day month weekday
    return `*/${minutes} * * * *`; // Every N minutes
  } else {
    // Use 6-field format for seconds: second minute hour day month weekday
    return `*/${seconds} * * * * *`; // Every N seconds
  }
}

/**
 * Schedule a ping job for a monitor based on its user's subscription plan
 */
export async function scheduleMonitor(monitorId: number): Promise<void> {
  try {
    // Stop existing job if any
    stopMonitor(monitorId);

    // Get monitor with user info
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { user: true },
    });

    if (!monitor) {
      console.error(`Cannot schedule monitor ${monitorId}: not found`);
      return;
    }

    if (!monitor.isActive) {
      console.log(`Monitor ${monitorId} is inactive, not scheduling`);
      return;
    }

    // Get user's plan
    const plan = await getUserPlan(monitor.userId);
    const intervalSeconds = getPingIntervalSeconds(plan);

    // Create cron expression
    const cronExpression = secondsToCronExpression(intervalSeconds);

    // Schedule the job
    const task = cron.schedule(
      cronExpression,
      async () => {
        await executePingJob(monitorId);
      },
      {
        scheduled: true,
        timezone: "UTC",
      },
    );

    activeJobs.set(monitorId, task);
    console.log(
      `Scheduled monitor ${monitorId} (plan: ${plan}, interval: ${intervalSeconds}s, cron: ${cronExpression})`,
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Error scheduling monitor ${monitorId}:`, errorMessage);
  }
}

/**
 * Stop and remove a monitor's ping job
 */
export function stopMonitor(monitorId: number): void {
  const task = activeJobs.get(monitorId);
  if (task) {
    task.stop();
    activeJobs.delete(monitorId);
    console.log(`Stopped monitor ${monitorId} ping job`);
  }
}

/**
 * Initialize and schedule all active monitors
 * Call this on server startup
 */
export async function initializeAllMonitors(): Promise<void> {
  try {
    console.log("Initializing monitor schedules...");
    const monitors = await prisma.monitor.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    for (const monitor of monitors) {
      await scheduleMonitor(monitor.id);
    }

    console.log(`Initialized ${monitors.length} monitor schedules`);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error initializing monitors:", errorMessage);
  }
}

/**
 * Reschedule a monitor (useful when subscription plan changes)
 */
export async function rescheduleMonitor(monitorId: number): Promise<void> {
  await scheduleMonitor(monitorId);
}

/**
 * Get all active monitor IDs
 */
export function getActiveMonitorIds(): number[] {
  return Array.from(activeJobs.keys());
}
