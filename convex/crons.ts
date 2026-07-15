import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily("daily app data backup", { hourUTC: 2, minuteUTC: 0 }, internal.appData.createDailyBackup);

export default crons;
