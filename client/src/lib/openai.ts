import { apiRequest } from "./queryClient";
import { StoryGeneration, SoundEffectPlacement } from "@shared/schema";

export interface SoundEffectSuggestion {
  description: string;
  timing: string;
}

export interface GeneratedStory {
  title: string;
  content: string;
  soundEffectSuggestions?: SoundEffectSuggestion[];
}

export async function generateStory(storyParams: StoryGeneration): Promise<GeneratedStory> {
  try {
    const response = await apiRequest("POST", "/api/stories/generate", storyParams);
    return await response.json();
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Failed to generate story. Please try again.");
  }
}

/**
 * Generate multiple stories in batch by running requests in parallel
 * @param storyParamsList Array of story generation parameters
 * @param concurrency How many stories to generate in parallel (default: 2)
 * @returns An array of generated stories
 */
export async function generateStoriesBatch(
  storyParamsList: StoryGeneration[], 
  concurrency: number = 2
): Promise<GeneratedStory[]> {
  // Create batches based on the concurrency level
  const results: GeneratedStory[] = [];
  const batches = [];
  
  // Split the params into batches
  for (let i = 0; i < storyParamsList.length; i += concurrency) {
    batches.push(storyParamsList.slice(i, i + concurrency));
  }
  
  // Process each batch in parallel
  for (const batch of batches) {
    try {
      // Run each batch concurrently
      const batchResults = await Promise.all(
        batch.map(params => generateStory(params))
      );
      
      // Add the results to our final array
      results.push(...batchResults);
    } catch (error) {
      console.error("Error in batch story generation:", error);
      throw error;
    }
  }
  
  return results;
}

/**
 * Generate audio for multiple stories in batch by running requests in parallel
 * @param stories Array of stories with text and voice settings
 * @param concurrency How many audio files to generate in parallel (default: 2)
 * @returns Array of audio URLs
 */
export async function generateAudioBatch(
  stories: { text: string; voice: string; title?: string; userId?: number }[],
  concurrency: number = 2
): Promise<string[]> {
  const results: string[] = [];
  const batches = [];
  
  // Split the stories into batches
  for (let i = 0; i < stories.length; i += concurrency) {
    batches.push(stories.slice(i, i + concurrency));
  }
  
  // Process each batch in parallel
  for (const batch of batches) {
    try {
      // Run each batch concurrently
      const batchResults = await Promise.all(
        batch.map(({ text, voice, userId, title }) => 
          generateAudio(text, voice, userId, title)
        )
      );
      
      // Add the results to our final array
      results.push(...batchResults);
    } catch (error) {
      console.error("Error in batch audio generation:", error);
      throw error;
    }
  }
  
  return results;
}

export async function generateAudio(text: string, voice: string = "female-gentle", userId?: number, title?: string): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/stories/generate-audio", { text, voice, userId, title });
    const data = await response.json();
    return data.audioUrl;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Failed to generate audio. Please try again.");
  }
}

export interface SaveStoryParams {
  title: string;
  text: string;
  prompt: string;
  ageRange: string;
  storyLength: string;
  storyType: string;
  narrator: string;
  audioUrl: string;
  userId?: number;
  soundEffects?: SoundEffectPlacement[];
  characterIds?: number[];
}

export async function saveStory(storyData: SaveStoryParams) {
  try {
    const response = await apiRequest("POST", "/api/stories", storyData);
    return await response.json();
  } catch (error) {
    console.error("Error saving story:", error);
    throw new Error("Failed to save story. Please try again.");
  }
}

/**
 * Generate a cover image for a story using OpenAI
 * @param title Story title
 * @param description Brief description or prompt for the image
 * @returns URL to the generated image
 */
export async function generateStoryImage(title: string, description: string): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/stories/generate-image", { 
      title, 
      description 
    });
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error generating story image:", error);
    throw new Error("Failed to generate image. Please try again.");
  }
}
