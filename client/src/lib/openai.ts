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
