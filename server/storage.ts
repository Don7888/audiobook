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
  getAllCharacters(): Promise<Character[]>;
  
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
  private characters: Map<number, Character>;
  private soundEffects: Map<number, SoundEffect>;
  currentUserId: number;
  currentStoryId: number;
  currentCharacterId: number;
  currentSoundEffectId: number;

  constructor() {
    this.users = new Map();
    this.stories = new Map();
    this.characters = new Map();
    this.soundEffects = new Map();
    this.currentUserId = 1;
    this.currentStoryId = 1;
    this.currentCharacterId = 1;
    this.currentSoundEffectId = 1;
    this.initializeSampleSoundEffects();
  }

  private async initializeSampleSoundEffects() {
    const sampleEffects: InsertSoundEffect[] = [
      { name: "Rain", category: "Weather", url: "/sounds/Weather/rain.mp3" },
      { name: "Thunder", category: "Weather", url: "/sounds/Weather/thunder.mp3" },
      { name: "Wind", category: "Weather", url: "/sounds/Weather/wind.mp3" },
      { name: "Cat", category: "Animals", url: "/sounds/Animals/cat.mp3" },
      { name: "Dog Barking", category: "Animals", url: "/sounds/Animals/dog-bark.mp3" },
      { name: "Birds Chirping", category: "Animals", url: "/sounds/Animals/birds.mp3" },
      { name: "Magic Spell", category: "Fantasy", url: "/sounds/Fantasy/magic-spell.mp3" },
      { name: "Dragon Roar", category: "Fantasy", url: "/sounds/Fantasy/dragon-roar.mp3" },
      { name: "Footsteps", category: "Human", url: "/sounds/Human/footsteps.mp3" },
      { name: "Laughter", category: "Human", url: "/sounds/Human/laugh.mp3" },
      { name: "Door Creaking", category: "Household", url: "/sounds/Household/door-creak.mp3" },
      { name: "Clock Ticking", category: "Household", url: "/sounds/Household/clock-tick.mp3" },
      { name: "Ocean Waves", category: "Environment", url: "/sounds/Environment/ocean-waves.mp3" },
      { name: "Forest Sounds", category: "Environment", url: "/sounds/Environment/forest.mp3" },
      { name: "Success Jingle", category: "Other", url: "/sounds/Other/success.mp3" },
      { name: "Alert Sound", category: "Other", url: "/sounds/Other/alert.mp3" },
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
      userId: insertStory.userId || null,
      soundEffects,
      characterIds: insertStory.characterIds || null
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
  
  // Character methods
  async getCharacter(id: number): Promise<Character | undefined> {
    return this.characters.get(id);
  }
  
  async getCharactersByUserId(userId: number): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(
      character => character.userId === userId
    );
  }
  
  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = this.currentCharacterId++;
    const now = new Date();
    
    const character: Character = { 
      ...insertCharacter, 
      id,
      createdAt: now
    };
    
    this.characters.set(id, character);
    return character;
  }
  
  async updateCharacter(id: number, characterUpdate: Partial<InsertCharacter>): Promise<Character | undefined> {
    const existingCharacter = this.characters.get(id);
    if (!existingCharacter) return undefined;
    
    const updatedCharacter = { ...existingCharacter, ...characterUpdate };
    this.characters.set(id, updatedCharacter);
    
    return updatedCharacter;
  }
  
  async deleteCharacter(id: number): Promise<boolean> {
    return this.characters.delete(id);
  }
  
  async getAllCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values());
  }
}

// Import database storage implementation
// For now, let's use the memory storage to ensure the app works reliably
export const storage = new MemStorage();
