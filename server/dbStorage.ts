import { db } from './db';
import { eq } from 'drizzle-orm';
import { 
  users, stories, soundEffects,
  InsertUser, User, InsertStory, Story, 
  InsertSoundEffect, SoundEffect, 
  SoundEffectPlacement
} from '../shared/schema';
import { IStorage } from './storage';

/**
 * PostgreSQL database implementation of the storage interface
 */
export class DbStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  
  async updateUserSubscription(id: number, subscriptionTier: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ subscriptionTier })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  // Story methods
  async getStory(id: number): Promise<Story | undefined> {
    const result = await db.select().from(stories).where(eq(stories.id, id));
    return result[0];
  }
  
  async getStoriesByUserId(userId: number): Promise<Story[]> {
    return db.select().from(stories).where(eq(stories.userId, userId));
  }
  
  async createStory(storyData: InsertStory): Promise<Story> {
    // Convert sound effects to JSON string for storage
    const dataToInsert = {
      ...storyData,
      // Cast to any to handle the type conversion for database storage
      soundEffects: storyData.soundEffects ? JSON.stringify(storyData.soundEffects) : null
    } as any;
    
    const result = await db.insert(stories).values(dataToInsert).returning();
    
    // Process the result for the application
    const story = {
      ...result[0],
      // Parse JSON string back to array
      soundEffects: result[0].soundEffects ? JSON.parse(result[0].soundEffects as string) as SoundEffectPlacement[] : null
    };
    
    return story;
  }
  
  async updateStory(id: number, storyUpdate: Partial<InsertStory>): Promise<Story | undefined> {
    // Handle the special case for sound effects
    let dataToUpdate: any = { ...storyUpdate };
    
    // Convert sound effects to JSON string if present
    if (storyUpdate.soundEffects !== undefined) {
      dataToUpdate.soundEffects = storyUpdate.soundEffects ? 
        JSON.stringify(storyUpdate.soundEffects) : 
        null;
    }
    
    const result = await db
      .update(stories)
      .set(dataToUpdate)
      .where(eq(stories.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    
    // Process the result for the application
    const story = {
      ...result[0],
      // Parse JSON string back to array
      soundEffects: result[0].soundEffects ? 
        JSON.parse(result[0].soundEffects as string) as SoundEffectPlacement[] : 
        null
    };
    
    return story;
  }
  
  async deleteStory(id: number): Promise<boolean> {
    const result = await db
      .delete(stories)
      .where(eq(stories.id, id))
      .returning({ id: stories.id });
    
    return result.length > 0;
  }
  
  async getAllStories(): Promise<Story[]> {
    const results = await db.select().from(stories);
    
    // Parse JSON strings back to arrays
    return results.map(story => ({
      ...story,
      // Handle JSON parsing for sound effects stored as strings
      soundEffects: story.soundEffects && typeof story.soundEffects === 'string' 
        ? JSON.parse(story.soundEffects) as SoundEffectPlacement[] 
        : null
    }));
  }
  
  // Sound effect methods
  async getSoundEffect(id: number): Promise<SoundEffect | undefined> {
    const result = await db.select().from(soundEffects).where(eq(soundEffects.id, id));
    return result[0];
  }
  
  async getSoundEffectsByCategory(category: string): Promise<SoundEffect[]> {
    return db.select().from(soundEffects).where(eq(soundEffects.category, category));
  }
  
  async createSoundEffect(effectData: InsertSoundEffect): Promise<SoundEffect> {
    const result = await db.insert(soundEffects).values(effectData).returning();
    return result[0];
  }
  
  async deleteSoundEffect(id: number): Promise<boolean> {
    const result = await db
      .delete(soundEffects)
      .where(eq(soundEffects.id, id))
      .returning({ id: soundEffects.id });
    
    return result.length > 0;
  }
  
  async getAllSoundEffects(): Promise<SoundEffect[]> {
    return db.select().from(soundEffects);
  }
  
  // Initialize with sample data
  async initializeSampleData() {
    // Check if we already have data
    const existingEffects = await this.getAllSoundEffects();
    if (existingEffects.length > 0) {
      console.log('Sample data already exists, skipping initialization');
      return;
    }
    
    // Add sample sound effects
    const sampleEffects = [
      { name: 'Rain', category: 'Nature', url: '/sound-effects/rain.mp3', duration: 5.2 },
      { name: 'Thunder', category: 'Nature', url: '/sound-effects/thunder.mp3', duration: 3.1 },
      { name: 'Birds', category: 'Nature', url: '/sound-effects/birds.mp3', duration: 4.5 },
      { name: 'Wind', category: 'Nature', url: '/sound-effects/wind.mp3', duration: 4.0 },
      { name: 'Ocean Waves', category: 'Nature', url: '/sound-effects/waves.mp3', duration: 6.3 },
      
      { name: 'Door Open', category: 'Household', url: '/sound-effects/door-open.mp3', duration: 1.2 },
      { name: 'Door Close', category: 'Household', url: '/sound-effects/door-close.mp3', duration: 0.8 },
      { name: 'Footsteps', category: 'Household', url: '/sound-effects/footsteps.mp3', duration: 3.4 },
      { name: 'Clock Ticking', category: 'Household', url: '/sound-effects/clock-ticking.mp3', duration: 5.0 },
      { name: 'Fire Crackling', category: 'Household', url: '/sound-effects/fire-crackling.mp3', duration: 4.7 },
      
      { name: 'Cat Meow', category: 'Animals', url: '/sound-effects/cat-meow.mp3', duration: 1.0 },
      { name: 'Dog Bark', category: 'Animals', url: '/sound-effects/dog-bark.mp3', duration: 1.5 },
      { name: 'Wolf Howl', category: 'Animals', url: '/sound-effects/wolf-howl.mp3', duration: 2.8 },
      { name: 'Lion Roar', category: 'Animals', url: '/sound-effects/lion-roar.mp3', duration: 2.2 },
      { name: 'Owl Hoot', category: 'Animals', url: '/sound-effects/owl-hoot.mp3', duration: 1.7 },
    ];
    
    // Create each sample effect
    for (const effect of sampleEffects) {
      await this.createSoundEffect(effect as InsertSoundEffect);
    }
    
    console.log('Sample data initialized successfully');
  }
}