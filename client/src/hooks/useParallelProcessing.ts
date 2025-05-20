import { generateStory, generateAudio, generateStoriesBatch, generateAudioBatch } from "@/lib/openai";
import { useState } from "react";
import { useToast } from "./use-toast";

/**
 * Custom hook for fast parallel processing of batch story generation
 */
export function useParallelProcessing() {
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  /**
   * Generate multiple stories in parallel
   * @param storyParams Array of story generation parameters
   * @param concurrency Number of stories to process in parallel (default: 2)
   * @returns Generated stories and audio URLs
   */
  const generateBatchStories = async (
    storyParams: any[],
    characterDetails: string,
    formData: any,
    userId?: number,
    concurrency: number = 2
  ) => {
    try {
      // Show starting toast notification
      toast({
        title: "Starting Batch Generation",
        description: `Generating ${storyParams.length} stories with optimized parallel processing.`,
      });

      // Prepare story parameters
      const storyParamsList = storyParams.map(item => ({
        prompt: characterDetails
          ? `${item.prompt}\n\nPlease include the following characters in the story:\n${characterDetails}`
          : item.prompt,
        ageRange: formData.ageRange,
        storyLength: formData.storyLength,
        storyType: formData.storyType,
        narrator: formData.narrator,
        batchMode: true,
        batchCount: storyParams.length,
        includeSoundEffects: formData.includeSoundEffects,
        batchPrompts: []
      }));

      setProgress(10);
      console.log("Starting parallel story generation with concurrency of", concurrency);

      // Process stories in parallel
      const generatedStories = await generateStoriesBatch(storyParamsList, concurrency);
      setProgress(50);

      toast({
        title: "Stories Generated",
        description: `Created ${generatedStories.length} stories. Now processing audio...`,
      });

      // Generate audio files in parallel
      const audioParams = generatedStories.map(story => ({
        text: story.content,
        voice: formData.narrator,
        userId: userId,
        title: story.title
      }));

      const audioUrls = await generateAudioBatch(audioParams, concurrency);
      setProgress(100);

      return { 
        stories: generatedStories, 
        audioUrls,
        validPrompts: storyParams
      };
    } catch (error) {
      console.error("Error in parallel batch processing:", error);
      throw error;
    }
  };

  return {
    progress,
    generateBatchStories
  };
}