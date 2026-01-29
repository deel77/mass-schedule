import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    isSuperadmin: v.boolean(),
    createdAt: v.number()
  }).index("by_email", ["email"]),

  parishes: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_slug", ["slug"]),

  parishUsers: defineTable({
    userId: v.id("users"),
    parishId: v.id("parishes"),
    createdAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_parish", ["parishId"])
    .index("by_user_parish", ["userId", "parishId"]),

  locations: defineTable({
    parishId: v.id("parishes"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    createdAt: v.number()
  })
    .index("by_parish", ["parishId"])
    .index("by_slug", ["parishId", "slug"]),

  weekLabels: defineTable({
    parishId: v.id("parishes"),
    startDate: v.string(),
    endDate: v.string(),
    label: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_parish_start", ["parishId", "startDate"]),

  days: defineTable({
    parishId: v.id("parishes"),
    date: v.string(),
    dayName: v.string(),
    info: v.optional(v.string()),
    weekLabelId: v.optional(v.id("weekLabels")),
    createdAt: v.number()
  })
    .index("by_parish_date", ["parishId", "date"])
    .index("by_week", ["weekLabelId"]),

  events: defineTable({
    dayId: v.id("days"),
    locationId: v.id("locations"),
    eventType: v.string(),
    timeText: v.string(),
    intention: v.optional(v.string()),
    info: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_day", ["dayId"])
    .index("by_location", ["locationId"])
    .index("by_day_location", ["dayId", "locationId"]),

  apiTokens: defineTable({
    name: v.string(),
    tokenHash: v.string(),
    tokenPrefix: v.string(),
    parishIds: v.array(v.id("parishes")),
    scopes: v.array(v.string()),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number())
  })
    .index("by_hash", ["tokenHash"])
    .index("by_active", ["isActive"])
});
