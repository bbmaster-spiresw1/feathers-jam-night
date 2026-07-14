import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const appDataKey = "appData";
const editPinKey = "editPin";
const defaultEditPin = "2468";

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
