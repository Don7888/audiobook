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
  userId: integer("user_id"), // NULL for shared effects, user ID for Premium user uploaded effects
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
  vibe: varchar("vibe", { length: 50 }),
  audioUrl: text("audio_url").notNull(),
  soundEffects: json("sound_effects").$type<SoundEffectPlacement[]>(),
  characterIds: json("character_ids").$type<number[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

// Schema for an individual batch story prompt
export const batchPromptSchema = z.object({
  prompt: z.string().min(10, "Please enter a longer story idea"),
});

// Schema for story generation with sound effects option and batch features
export const storyGenerationSchema = z.object({
  prompt: z.string().min(10, "Please enter a longer story idea"),
  ageRange: z.string(),
  storyLength: z.string(),
  storyType: z.string(),
  narrator: z.string(),
  vibe: z.string().optional(),
  includeSoundEffects: z.boolean().optional().default(false),
  batchMode: z.boolean().optional().default(false),
  batchCount: z.number().min(1).max(10).optional().default(3),
  batchPrompts: z.array(batchPromptSchema).optional().default([]),
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
    maxAudioLength: 300, // 5 minutes in seconds
    description: "Create up to 3 stories with basic features"
  },
  pro: {
    price: 9.99,
    maxStories: 50,
    allowSoundEffects: true,
    maxAudioLength: 900, // 15 minutes in seconds
    description: "Create up to 50 stories with sound effects"
  },
  premium: {
    price: 19.99,
    maxStories: -1, // Unlimited
    allowSoundEffects: true,
    maxAudioLength: 1800, // 30 minutes in seconds
    description: "Unlimited stories with premium features"
  }
};

// Schema for character creation
export const characterCreationSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  appearance: z.string().min(5, "Please describe the character's appearance"),
  personality: z.string().min(5, "Please describe the character's personality"),
});

// Schema for story templates
export const storyTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  prompt: z.string(),
  category: z.string(),
  recommendedAge: z.string(),
  recommendedLength: z.string(),
  recommendedType: z.string(),
  tags: z.array(z.string()),
});

// Story templates data
export const storyTemplates = [
  {
    id: "magical-forest",
    title: "Magical Forest Adventure",
    description: "A child discovers a hidden magical forest where animals can talk",
    prompt: "A young child finds a secret path that leads to a magical forest where all the animals can talk and need help solving a problem",
    category: "Adventure",
    recommendedAge: "3-5",
    recommendedLength: "short",
    recommendedType: "adventure",
    tags: ["magic", "animals", "forest", "friendship"]
  },
  {
    id: "space-explorer",
    title: "Little Space Explorer",
    description: "An exciting journey through space meeting friendly aliens",
    prompt: "A brave young astronaut travels through space and meets colorful alien friends who teach them about different planets",
    category: "Adventure",
    recommendedAge: "5-7",
    recommendedLength: "medium",
    recommendedType: "adventure",
    tags: ["space", "aliens", "exploration", "learning"]
  },
  {
    id: "underwater-kingdom",
    title: "Underwater Kingdom",
    description: "Dive deep into an ocean kingdom with mermaids and sea creatures",
    prompt: "A child with a special swimming ability discovers an underwater kingdom where mermaids and sea creatures live in harmony",
    category: "Adventure",
    recommendedAge: "4-6",
    recommendedLength: "medium",
    recommendedType: "adventure",
    tags: ["ocean", "mermaids", "underwater", "friendship"]
  },
  {
    id: "dragon-friend",
    title: "The Friendly Dragon",
    description: "A misunderstood dragon just wants to make friends",
    prompt: "Everyone in the village is afraid of the dragon on the mountain, but one brave child discovers the dragon is actually very kind and just lonely",
    category: "Friendship",
    recommendedAge: "3-6",
    recommendedLength: "short",
    recommendedType: "friendship",
    tags: ["dragon", "friendship", "kindness", "courage"]
  },
  {
    id: "time-traveler",
    title: "Time Traveling Adventure",
    description: "A child travels through time to different historical periods",
    prompt: "A curious child finds a magical clock that transports them to different time periods where they learn about history and help solve problems",
    category: "Educational",
    recommendedAge: "6-8",
    recommendedLength: "long",
    recommendedType: "educational",
    tags: ["time travel", "history", "learning", "adventure"]
  },
  {
    id: "superhero-day",
    title: "Everyday Superhero",
    description: "A child discovers they have special powers to help others",
    prompt: "A regular child wakes up one day with the power to help others in small but meaningful ways around their neighborhood",
    category: "Adventure",
    recommendedAge: "4-7",
    recommendedLength: "medium",
    recommendedType: "adventure",
    tags: ["superhero", "helping", "community", "powers"]
  },
  {
    id: "lost-pet",
    title: "The Lost Pet Adventure",
    description: "Help a lost pet find their way back home",
    prompt: "A kind child finds a lost pet and goes on an adventure through the neighborhood to help the pet find its way back home",
    category: "Friendship",
    recommendedAge: "3-5",
    recommendedLength: "short",
    recommendedType: "friendship",
    tags: ["pets", "helping", "neighborhood", "kindness"]
  },
  {
    id: "rainbow-bridge",
    title: "The Rainbow Bridge",
    description: "Cross a magical rainbow bridge to a land of colors",
    prompt: "After a storm, a child sees a beautiful rainbow and discovers they can walk across it to a magical land where everything is made of colors",
    category: "Fantasy",
    recommendedAge: "3-6",
    recommendedLength: "medium",
    recommendedType: "fantasy",
    tags: ["rainbow", "colors", "magic", "wonder"]
  },
  {
    id: "treasure-hunt",
    title: "Backyard Treasure Hunt",
    description: "An exciting treasure hunt in the backyard with family",
    prompt: "A child and their family go on a treasure hunt in their own backyard and discover that the real treasure is spending time together",
    category: "Family",
    recommendedAge: "4-6",
    recommendedLength: "short",
    recommendedType: "family",
    tags: ["treasure", "family", "backyard", "togetherness"]
  },
  {
    id: "robot-helper",
    title: "My Robot Helper",
    description: "A child builds a robot that becomes their best friend",
    prompt: "A creative child builds a robot from recycled materials, and the robot comes to life to help with daily tasks and become a loyal friend",
    category: "Technology",
    recommendedAge: "5-8",
    recommendedLength: "medium",
    recommendedType: "adventure",
    tags: ["robots", "friendship", "creativity", "technology"]
  }
];

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
export type StoryTemplate = z.infer<typeof storyTemplateSchema>;
export type SoundEffectPlacement = z.infer<typeof soundEffectPlacementSchema>;
export type SubscriptionTier = z.infer<typeof subscriptionTierEnum>;
