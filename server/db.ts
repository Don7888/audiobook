import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, stories, soundEffects } from '../shared/schema';

// Configure neon to use WebSocket for better performance
neonConfig.fetchConnectionCache = true;

// Initialize database connection using the DATABASE_URL environment variable
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Export types for use in the application
export type DbUsers = typeof users;
export type DbStories = typeof stories;
export type DbSoundEffects = typeof soundEffects;

// Simple migration function to create tables if they don't exist
export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        subscription_tier TEXT NOT NULL DEFAULT 'basic',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS sound_effects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        url TEXT NOT NULL,
        duration REAL NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        prompt TEXT NOT NULL,
        age_range TEXT NOT NULL,
        story_length TEXT NOT NULL,
        story_type TEXT NOT NULL,
        narrator TEXT NOT NULL,
        audio_url TEXT,
        sound_effects JSONB,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    
    console.log('Database migrations completed successfully.');
  } catch (error) {
    console.error('Error running database migrations:', error);
    throw error;
  }
}