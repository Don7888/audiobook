import { pgTable, text, serial, integer, boolean, varchar, timestamp, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Subscription tiers
export const subscriptionTierEnum = z.enum(["basic", "pro", "premium"]);

// User schema
// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).notNull().default("basic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  subscriptionTier: true,
});

// Character schema
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  appearance: text("appearance").notNull(),
  personality: text("personality").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});

// Sound effects schema
export const soundEffects = pgTable("sound_effects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSoundEffectSchema = createInsertSchema(soundEffects).omit({
  id: true,
  createdAt: true,
});

// Story schema with sound effects
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  text: text("text").notNull(),
  prompt: text("prompt").notNull(),
  ageRange: varchar("age_range", { length: 50 }).notNull(),
  storyLength: varchar("story_length", { length: 50 }).notNull(),
  storyType: varchar("story_type", { length: 50 }).notNull(),
  narrator: varchar("narrator", { length: 50 }).notNull(),
  audioUrl: text("audio_url").notNull(),
  soundEffects: json("sound_effects").$type<SoundEffectPlacement[]>(),
  characterIds: json("character_ids").$type<number[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

// Schema for story generation with sound effects option
export const storyGenerationSchema = z.object({
  prompt: z.string().min(10, "Please enter a longer story idea"),
  ageRange: z.string(),
  storyLength: z.string(),
  storyType: z.string(),
  narrator: z.string(),
  includeSoundEffects: z.boolean().optional().default(false),
});

// Schema for sound effect placement
export const soundEffectPlacementSchema = z.object({
  soundEffectId: z.number(),
  timestamp: z.number(), // Position in seconds where the sound effect should play
  volume: z.number().min(0).max(1).default(1),
});

// Subscription plan features
export const subscriptionPlans = {
  basic: {
    price: 0,
    maxStories: 3,
    allowSoundEffects: false,
    maxAudioLength: 5 * 60, // 5 minutes in seconds
    description: "Create up to 3 stories with basic features"
  },
  pro: {
    price: 9.99,
    maxStories: 50,
    allowSoundEffects: true,
    maxAudioLength: 15 * 60, // 15 minutes in seconds
    description: "Create up to 50 stories with sound effects"
  },
  premium: {
    price: 19.99,
    maxStories: -1, // Unlimited
    allowSoundEffects: true,
    maxAudioLength: 30 * 60, // 30 minutes in seconds
    description: "Unlimited stories with premium features"
  }
};

// Schema for character creation
export const characterCreationSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  appearance: z.string().min(5, "Please describe the character's appearance"),
  personality: z.string().min(5, "Please describe the character's personality"),
});

// Schema for story generation with character selection
export const storyWithCharactersSchema = storyGenerationSchema.extend({
  characterIds: z.array(z.number()).optional(),
});

// Export Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type CharacterCreation = z.infer<typeof characterCreationSchema>;

export type SoundEffect = typeof soundEffects.$inferSelect;
export type InsertSoundEffect = z.infer<typeof insertSoundEffectSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type StoryGeneration = z.infer<typeof storyGenerationSchema>;
export type StoryWithCharacters = z.infer<typeof storyWithCharactersSchema>;
export type SoundEffectPlacement = z.infer<typeof soundEffectPlacementSchema>;
export type SubscriptionTier = z.infer<typeof subscriptionTierEnum>;
