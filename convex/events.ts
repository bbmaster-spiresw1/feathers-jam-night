import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByMonth = query({
  args: {
    monthPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("events").withIndex("by_date").collect();
    return events.filter((event) => event.date.startsWith(args.monthPrefix));
  },
});

export const moveGuest = mutation({
  args: {
    eventGuestId: v.id("eventGuests"),
    direction: v.union(v.literal(-1), v.literal(1)),
  },
  handler: async (ctx, args) => {
    const current = await ctx.db.get(args.eventGuestId);
    if (!current) return;

    const guests = await ctx.db
      .query("eventGuests")
      .withIndex("by_event", (q) => q.eq("eventId", current.eventId))
      .collect();
    const ordered = guests.sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((guest) => guest._id === args.eventGuestId);
    const target = index + args.direction;
    if (target < 0 || target >= ordered.length) return;

    await ctx.db.patch(ordered[index]._id, { order: ordered[target].order });
    await ctx.db.patch(ordered[target]._id, { order: ordered[index].order });
  },
});

export const moveSong = mutation({
  args: {
    eventGuestSongId: v.id("eventGuestSongs"),
    direction: v.union(v.literal(-1), v.literal(1)),
  },
  handler: async (ctx, args) => {
    const current = await ctx.db.get(args.eventGuestSongId);
    if (!current) return;

    const songs = await ctx.db
      .query("eventGuestSongs")
      .withIndex("by_event_guest", (q) => q.eq("eventGuestId", current.eventGuestId))
      .collect();
    const ordered = songs.sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((song) => song._id === args.eventGuestSongId);
    const target = index + args.direction;
    if (target < 0 || target >= ordered.length) return;

    await ctx.db.patch(ordered[index]._id, { order: ordered[target].order });
    await ctx.db.patch(ordered[target]._id, { order: ordered[index].order });
  },
});
