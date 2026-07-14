import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  members: defineTable({
    name: v.string(),
    instruments: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    isSinger: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  guests: defineTable({
    name: v.string(),
    performanceType: v.union(v.literal("solo"), v.literal("band"), v.literal("showcase"), v.literal("member")),
    linkedMemberId: v.optional(v.id("members")),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_linked_member", ["linkedMemberId"]),

  events: defineTable({
    date: v.string(),
    title: v.string(),
    status: v.union(v.literal("draft"), v.literal("saved"), v.literal("published"), v.literal("archived")),
    notes: v.optional(v.string()),
    songsPerGuest: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_status", ["status"]),

  eventBandMembers: defineTable({
    eventId: v.id("events"),
    memberId: v.id("members"),
    order: v.number(),
    roleNotes: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_member", ["memberId"]),

  eventGuests: defineTable({
    eventId: v.id("events"),
    guestId: v.id("guests"),
    order: v.number(),
    bookingNotes: v.optional(v.string()),
    checkedInAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_guest", ["guestId"]),

  songs: defineTable({
    title: v.string(),
    artist: v.optional(v.string()),
    defaultKey: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_title", ["title"])
    .searchIndex("search_songs", {
      searchField: "title",
      filterFields: ["artist"],
    }),

  eventGuestSongs: defineTable({
    eventGuestId: v.id("eventGuests"),
    songId: v.optional(v.id("songs")),
    title: v.string(),
    artist: v.optional(v.string()),
    key: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    order: v.number(),
  }).index("by_event_guest", ["eventGuestId"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
