import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for multiple authentication methods
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").unique(),
  email: text("email").unique(),
  phoneNumber: text("phone_number").unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  authProvider: text("auth_provider").notNull().default('username'),
  location: jsonb("location").$type<{ lat: number; lng: number; address?: string }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Government schemes for women empowerment
export const schemes = pgTable("schemes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  details: text("details").notNull(),
  benefits: text("benefits").notNull(),
  eligibility: text("eligibility").notNull(),
  applicationUrl: text("application_url"),
  documents: text("documents"),
  level: text("level"), // central, state, etc.
  category: text("category"),
  tags: text("tags").array(),
});

// Crime data zones for danger mapping
export const crimeZones = pgTable("crime_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  state: text("state").notNull(),
  year: integer("year").notNull(),
  location: jsonb("location").$type<{ lat: number; lng: number }>(),
  rapeCount: integer("rape_count").default(0),
  kidnappingCount: integer("kidnapping_count").default(0),
  domesticViolenceCount: integer("domestic_violence_count").default(0),
  totalCrimes: integer("total_crimes").default(0),
  riskLevel: text("risk_level").notNull(), // low, medium, high, critical
});

// Weather and disaster data
export const disasters = pgTable("disasters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  location: jsonb("location").$type<{ lat: number; lng: number; name: string }>().notNull(),
  type: text("type").notNull(), // flood, storm, drought, earthquake
  severity: text("severity").notNull(), // low, moderate, high, severe
  forecast: jsonb("forecast").$type<{ temperature: number; conditions: string; humidity: number }>(),
  alertDate: timestamp("alert_date").notNull(),
  description: text("description"),
});

// Crop recommendations for farmers
export const cropRecommendations = pgTable("crop_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  district: text("district").notNull(),
  state: text("state").notNull().default('Punjab'),
  soilType: text("soil_type").notNull(),
  fertilityRating: real("fertility_rating").notNull(), // 0-10 scale
  recommendedCrops: text("recommended_crops").array().notNull(),
  profitabilityScore: real("profitability_score").notNull(), // 0-100 scale
  weatherConditions: text("weather_conditions"),
  bestSeason: text("best_season"),
});

// Safety check-ins and emergency alerts
export const safetyCheckIns = pgTable("safety_check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  location: jsonb("location").$type<{ lat: number; lng: number }>().notNull(),
  status: text("status").notNull(), // safe, unsafe, emergency
  timestamp: timestamp("timestamp").defaultNow(),
  zoneRiskLevel: text("zone_risk_level"),
  emergencyContacted: integer("emergency_contacted").default(0), // 0 or 1 (boolean)
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSchemeSchema = createInsertSchema(schemes).omit({
  id: true,
});

export const insertCrimeZoneSchema = createInsertSchema(crimeZones).omit({
  id: true,
});

export const insertDisasterSchema = createInsertSchema(disasters).omit({
  id: true,
});

export const insertCropRecommendationSchema = createInsertSchema(cropRecommendations).omit({
  id: true,
});

export const insertSafetyCheckInSchema = createInsertSchema(safetyCheckIns).omit({
  id: true,
  timestamp: true,
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Scheme = typeof schemes.$inferSelect;
export type InsertScheme = z.infer<typeof insertSchemeSchema>;

export type CrimeZone = typeof crimeZones.$inferSelect;
export type InsertCrimeZone = z.infer<typeof insertCrimeZoneSchema>;

export type Disaster = typeof disasters.$inferSelect;
export type InsertDisaster = z.infer<typeof insertDisasterSchema>;

export type CropRecommendation = typeof cropRecommendations.$inferSelect;
export type InsertCropRecommendation = z.infer<typeof insertCropRecommendationSchema>;

export type SafetyCheckIn = typeof safetyCheckIns.$inferSelect;
export type InsertSafetyCheckIn = z.infer<typeof insertSafetyCheckInSchema>;
