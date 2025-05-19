import { 
  users, type User, type InsertUser, 
  stories, type Story, type InsertStory,
  characters, type Character, type InsertCharacter,
  soundEffects, type SoundEffect, type InsertSoundEffect,
  type SoundEffectPlacement
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(id: number, subscriptionTier: string): Promise<User | undefined>;
  
  // Story methods
  getStory(id: number): Promise<Story | undefined>;
  getStoriesByUserId(userId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: number, story: Partial<InsertStory>): Promise<Story | undefined>;
  deleteStory(id: number): Promise<boolean>;
  getAllStories(): Promise<Story[]>;
  
  // Character methods
  getCharacter(id: number): Promise<Character | undefined>;
  getCharactersByUserId(userId: number): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, character: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<boolean>;
  
  // Sound effect methods
  getSoundEffect(id: number): Promise<SoundEffect | undefined>;
  getSoundEffectsByCategory(category: string): Promise<SoundEffect[]>;
  createSoundEffect(soundEffect: InsertSoundEffect): Promise<SoundEffect>;
  deleteSoundEffect(id: number): Promise<boolean>;
  getAllSoundEffects(): Promise<SoundEffect[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stories: Map<number, Story>;
  private soundEffects: Map<number, SoundEffect>;
  currentUserId: number;
  currentStoryId: number;
  currentSoundEffectId: number;

  constructor() {
    this.users = new Map();
    this.stories = new Map();
    this.soundEffects = new Map();
    this.currentUserId = 1;
    this.currentStoryId = 1;
    this.currentSoundEffectId = 1;
    this.initializeSampleSoundEffects();
  }

  private async initializeSampleSoundEffects() {
    const sampleEffects: InsertSoundEffect[] = [
      { name: "Rain", category: "Weather", url: "/sounds/rain.mp3" },
      { name: "Thunder", category: "Weather", url: "/sounds/thunder.mp3" },
      { name: "Wind", category: "Weather", url: "/sounds/wind.mp3" },
      { name: "Fire", category: "Environment", url: "/sounds/fire.mp3" },
      { name: "Forest", category: "Environment", url: "/sounds/forest.mp3" },
      { name: "Ocean", category: "Environment", url: "/sounds/ocean.mp3" },
      { name: "Birds", category: "Animals", url: "/sounds/birds.mp3" },
      { name: "Cat", category: "Animals", url: "/sounds/cat.mp3" },
      { name: "Dog", category: "Animals", url: "/sounds/dog.mp3" },
      { name: "Laughter", category: "Human", url: "/sounds/laughter.mp3" },
      { name: "Gasp", category: "Human", url: "/sounds/gasp.mp3" },
      { name: "Doorbell", category: "Household", url: "/sounds/doorbell.mp3" },
      { name: "Door Creak", category: "Household", url: "/sounds/door-creak.mp3" },
      { name: "Magic Spell", category: "Fantasy", url: "/sounds/magic-spell.mp3" },
      { name: "Dragon Roar", category: "Fantasy", url: "/sounds/dragon-roar.mp3" },
    ];

    for (const effect of sampleEffects) {
      await this.createSoundEffect(effect);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now, 
      subscriptionTier: insertUser.subscriptionTier ?? "basic" 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserSubscription(id: number, subscriptionTier: string): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, subscriptionTier };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Story methods
  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getStoriesByUserId(userId: number): Promise<Story[]> {
    return Array.from(this.stories.values()).filter(
      (story) => story.userId === userId
    );
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentStoryId++;
    const now = new Date();
    
    // Handle sound effects properly with type safety
    const soundEffects = insertStory.soundEffects ? 
      Array.isArray(insertStory.soundEffects) ? 
        insertStory.soundEffects : 
        [] 
      : [];
      
    const story: Story = { 
      ...insertStory, 
      id, 
      createdAt: now,
      soundEffects
    };
    
    this.stories.set(id, story);
    return story;
  }

  async updateStory(id: number, storyUpdate: Partial<InsertStory>): Promise<Story | undefined> {
    const existingStory = this.stories.get(id);
    if (!existingStory) return undefined;
    
    // Handle sound effects with type safety
    let soundEffects = existingStory.soundEffects || [];
    if (storyUpdate.soundEffects) {
      soundEffects = Array.isArray(storyUpdate.soundEffects) ? storyUpdate.soundEffects : [];
    }
    
    const updatedStory = { 
      ...existingStory, 
      ...storyUpdate,
      soundEffects
    };
    
    this.stories.set(id, updatedStory);
    return updatedStory;
  }

  async deleteStory(id: number): Promise<boolean> {
    return this.stories.delete(id);
  }

  async getAllStories(): Promise<Story[]> {
    return Array.from(this.stories.values());
  }

  // Sound effect methods
  async getSoundEffect(id: number): Promise<SoundEffect | undefined> {
    return this.soundEffects.get(id);
  }

  async getSoundEffectsByCategory(category: string): Promise<SoundEffect[]> {
    return Array.from(this.soundEffects.values()).filter(
      (effect) => effect.category === category
    );
  }

  async createSoundEffect(insertSoundEffect: InsertSoundEffect): Promise<SoundEffect> {
    const id = this.currentSoundEffectId++;
    const now = new Date();
    const soundEffect: SoundEffect = { ...insertSoundEffect, id, createdAt: now };
    this.soundEffects.set(id, soundEffect);
    return soundEffect;
  }

  async deleteSoundEffect(id: number): Promise<boolean> {
    return this.soundEffects.delete(id);
  }

  async getAllSoundEffects(): Promise<SoundEffect[]> {
    return Array.from(this.soundEffects.values());
  }
}

// Import database storage implementation
// For now, let's use the memory storage to ensure the app works reliably
export const storage = new MemStorage();
