import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const appDataKey = "appData";
const editPinKey = "editPin";
const defaultEditPin = "2468";
const maxBackups = 90;

function summarizeAppData(value: any) {
  const events = Array.isArray(value?.events) ? value.events : [];
  const people = Array.isArray(value?.people) ? value.people : [];
  const songIdeas = Array.isArray(value?.songBank) ? value.songBank : [];
  const eventSongCount = events.reduce(
    (total: number, event: any) =>
      total +
      (Array.isArray(event?.guests)
        ? event.guests.reduce((guestTotal: number, guest: any) => guestTotal + (Array.isArray(guest?.songs) ? guest.songs.length : 0), 0)
        : 0),
    0,
  );

  return {
    eventCount: events.length,
    peopleCount: people.length,
    songIdeaCount: songIdeas.length,
    eventSongCount,
  };
}

async function getCurrentAppData(ctx: any) {
  const row = await ctx.db
    .query("settings")
    .withIndex("by_key", (q: any) => q.eq("key", appDataKey))
    .first();

  return row;
}

async function pruneOldBackups(ctx: any) {
  const backups = await ctx.db.query("appDataBackupSummaries").withIndex("by_createdAt").order("desc").collect();
  const backupsToDelete = backups.slice(maxBackups);
  for (const backup of backupsToDelete) {
    const contents = await ctx.db
      .query("appDataBackupContents")
      .withIndex("by_backupId", (q: any) => q.eq("backupId", backup._id))
      .collect();
    for (const content of contents) {
      await ctx.db.delete(content._id);
    }
    await ctx.db.delete(backup._id);
  }
}

async function createBackupRow(ctx: any, source: "manual" | "daily" | "pre-restore", label: string) {
  const row = await getCurrentAppData(ctx);
  if (!row?.value) return null;

  const now = Date.now();
  const summary = summarizeAppData(row.value);
  const backupId = await ctx.db.insert("appDataBackupSummaries", {
    label,
    source,
    createdAt: now,
    ...summary,
  });
  await ctx.db.insert("appDataBackupContents", {
    backupId,
    value: row.value,
    createdAt: now,
  });
  await pruneOldBackups(ctx);
  return backupId;
}

async function getBackupValue(ctx: any, backupId: string) {
  const content = await ctx.db
    .query("appDataBackupContents")
    .withIndex("by_backupId", (q: any) => q.eq("backupId", backupId))
    .first();
  if (content) return content.value;

  const legacyBackup = await ctx.db.get(backupId as any);
  return legacyBackup?.value ?? null;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", appDataKey))
      .first();

    return row?.value ?? null;
  },
});

export const listBackups = query({
  args: {},
  handler: async (ctx: any) => {
    const backups = await ctx.db.query("appDataBackupSummaries").withIndex("by_createdAt").order("desc").take(30);
    return backups.map((backup: any) => ({
      id: backup._id,
      label: backup.label,
      source: backup.source,
      createdAt: backup.createdAt,
      eventCount: backup.eventCount,
      peopleCount: backup.peopleCount,
      songIdeaCount: backup.songIdeaCount,
      eventSongCount: backup.eventSongCount,
    }));
  },
});

export const save = mutation({
  args: {
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", appDataKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      key: appDataKey,
      value: args.value,
      updatedAt: now,
    });
  },
});

export const createBackup = mutation({
  args: {},
  handler: async (ctx: any) => {
    return await createBackupRow(ctx, "manual", `Manual backup - ${new Date().toISOString()}`);
  },
});

export const restoreBackup = mutation({
  args: {
    backupId: v.string(),
  },
  handler: async (ctx: any, args) => {
    const backupValue = await getBackupValue(ctx, args.backupId);
    if (!backupValue) return false;

    await createBackupRow(ctx, "pre-restore", `Before restore - ${new Date().toISOString()}`);

    const now = Date.now();
    const existing = await getCurrentAppData(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: backupValue,
        updatedAt: now,
      });
      return backupValue;
    }

    await ctx.db.insert("settings", {
      key: appDataKey,
      value: backupValue,
      updatedAt: now,
    });
    return backupValue;
  },
});

export const createDailyBackup = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    return await createBackupRow(ctx, "daily", `Daily backup - ${new Date().toISOString()}`);
  },
});

export const verifyEditPin = mutation({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", editPinKey))
      .first();

    return args.pin.trim() === (row?.value || defaultEditPin);
  },
});

export const changeEditPin = mutation({
  args: {
    currentPin: v.string(),
    nextPin: v.string(),
  },
  handler: async (ctx, args) => {
    const currentPin = args.currentPin.trim();
    const nextPin = args.nextPin.trim();
    if (nextPin.length < 4) return false;

    const now = Date.now();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", editPinKey))
      .first();
    const storedPin = existing?.value || defaultEditPin;
    if (currentPin !== storedPin) return false;

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: nextPin,
        updatedAt: now,
      });
      return true;
    }

    await ctx.db.insert("settings", {
      key: editPinKey,
      value: nextPin,
      updatedAt: now,
    });
    return true;
  },
});
