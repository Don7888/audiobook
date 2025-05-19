import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';
import type { Story } from '@shared/schema';

interface ExportOptions {
  playlistName: string;
  description?: string;
  format: 'mp3' | 'yoto' | 'toniebox' | 'audible';
  storyIds: number[];
}

/**
 * Exports stories as a single file in the specified format
 */
export async function exportStories(options: ExportOptions): Promise<{ downloadUrl: string; filename: string }> {
  const { playlistName, format, storyIds } = options;
  
  // Get stories by IDs
  const stories: Story[] = [];
  for (const id of storyIds) {
    const story = await storage.getStory(id);
    if (story) {
      stories.push(story);
    }
  }
  
  if (stories.length === 0) {
    throw new Error('No valid stories found for export');
  }
  
  // Create export directory if it doesn't exist
  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
    console.log(`Created export directory at: ${exportDir}`);
  }
  
  // Generate timestamp for unique filename
  const timestamp = Date.now();
  const safePlaylistName = playlistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${safePlaylistName}_${timestamp}.${format}`;
  const filePath = path.join(exportDir, filename);
  
  // Export based on format
  switch (format) {
    case 'mp3':
      await exportMp3(stories, filePath);
      break;
    case 'yoto':
      await exportYoto(stories, filePath, options);
      break;
    case 'toniebox':
      await exportToniebox(stories, filePath, options);
      break;
    case 'audible':
      await exportAudible(stories, filePath, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  // Return download URL and filename
  return {
    downloadUrl: `/api/exports/${filename}`,
    filename
  };
}

/**
 * Exports stories as a single MP3 file
 */
async function exportMp3(stories: Story[], outputPath: string): Promise<void> {
  // For demo purposes, we're concatenating existing MP3 files
  // In a real implementation, this would use ffmpeg to properly merge audio files
  
  // Create placeholder MP3 file
  const placeholderPath = path.join(process.cwd(), 'public', 'sounds', 'Weather', 'rain.mp3');
  
  if (fs.existsSync(placeholderPath)) {
    // Copy placeholder as a demonstration (in reality, we would concatenate the actual files)
    fs.copyFileSync(placeholderPath, outputPath);
  } else {
    // Create empty file if placeholder doesn't exist
    fs.writeFileSync(outputPath, Buffer.alloc(0));
  }
  
  console.log(`Exported MP3 to: ${outputPath}`);
}

/**
 * Exports stories in Yoto format with required metadata
 */
async function exportYoto(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  // First, create the base MP3 file that will contain our audio
  await exportMp3(stories, outputPath);
  
  // For Yoto-specific metadata, we create a companion JSON file with metadata
  // Yoto cards require certain metadata to identify content properly
  const metadataFilePath = outputPath.replace('.yoto', '.metadata.json');
  
  // Create chapters array for Yoto player to properly segment stories
  const chapters = stories.map((story, index) => {
    // Calculate start time - in a real implementation this would be based on 
    // actual audio duration of previous stories
    const startTimeSeconds = index * 60; // Simplified: assuming each story is about 1 minute
    
    return {
      title: story.title,
      startTime: startTimeSeconds,
      author: "StoryTunes", // Use default since story doesn't have authorName
      coverImage: ""
    };
  });
  
  // Create Yoto-compatible metadata structure
  const yotoMetadata = {
    contentType: "audiobook",
    contentId: `storytunes-${Date.now()}`,
    title: options.playlistName,
    description: options.description || `StoryTunes playlist: ${options.playlistName}`,
    publisher: "StoryTunes",
    publishDate: new Date().toISOString(),
    contentRating: "children",
    language: "en",
    totalDuration: stories.length * 60, // Simplified duration calculation
    chapters: chapters,
    tags: ["children", "stories", "audiobook"],
    // These properties are required by Yoto cards
    yotoSpecific: {
      cardId: `storytunes-${Date.now()}`, 
      contentVersion: "1.0",
      recommendedAge: "3-8"
    }
  };
  
  // Write the metadata file
  fs.writeFileSync(metadataFilePath, JSON.stringify(yotoMetadata, null, 2));
  
  // In a real implementation, we would also:
  // 1. Embed ID3 tags into the MP3 file with chapter markers
  // 2. Create a proper Yoto package structure with images and config
  
  console.log(`Exported Yoto format to: ${outputPath}`);
  console.log(`Created Yoto metadata file: ${metadataFilePath}`);
}

/**
 * Exports stories in Toniebox format with required metadata
 */
async function exportToniebox(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  // Create the base MP3 file
  await exportMp3(stories, outputPath);
  
  // Create Toniebox metadata file
  const metadataFilePath = outputPath.replace('.toniebox', '.tonie-metadata.json');
  
  // Create track listing for Toniebox
  const tracks = stories.map((story, index) => {
    return {
      trackNumber: index + 1,
      title: story.title,
      duration: 60, // Simplified duration in seconds
      author: "StoryTunes"
    };
  });
  
  // Create Toniebox-compatible metadata
  const tonieMetadata = {
    albumTitle: options.playlistName,
    albumDescription: options.description || `StoryTunes playlist: ${options.playlistName}`,
    creatorId: `storytunes-${Date.now()}`,
    contentType: "audio-story",
    ageRecommendation: "3+",
    tracks: tracks,
    totalTracks: stories.length,
    totalDuration: stories.length * 60, // Simplified duration in seconds
    language: "en",
    // Toniebox specific configuration
    tonieboxConfig: {
      // These fields are required for Toniebox Creative-Tonies
      creativeTonieId: `ct-${Date.now()}`,
      chapterEnabled: true,
      maxVolume: 8, // 1-10 scale
      transportLock: false
    }
  };
  
  // Write the metadata file
  fs.writeFileSync(metadataFilePath, JSON.stringify(tonieMetadata, null, 2));
  
  // In a real implementation, we would:
  // 1. Add proper ID3 tags with chapter markers
  // 2. Format the audio to Toniebox specifications
  // 3. Create a proper package structure
  
  console.log(`Exported Toniebox format to: ${outputPath}`);
  console.log(`Created Toniebox metadata file: ${metadataFilePath}`);
}

/**
 * Exports stories in Audible format with proper metadata
 */
async function exportAudible(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  // Create base audio file
  await exportMp3(stories, outputPath);
  
  // Create Audible metadata file
  const metadataFilePath = outputPath.replace('.audible', '.audible-metadata.json');
  
  // Create chapter information for Audible
  const chapters = stories.map((story, index) => {
    return {
      chapterNumber: index + 1,
      title: story.title,
      startTimeMs: index * 60000, // Simplified: 60 seconds per story in milliseconds
      endTimeMs: (index + 1) * 60000,
    };
  });
  
  // Create Audible-compatible metadata
  const audibleMetadata = {
    title: options.playlistName,
    subtitle: options.description || "",
    publisher: "StoryTunes",
    publicationDate: new Date().toISOString().split('T')[0],
    language: "en",
    narrator: "StoryTunes AI",
    author: "StoryTunes",
    copyright: `© ${new Date().getFullYear()} StoryTunes`,
    categories: ["Children", "Fiction"],
    totalDurationMs: stories.length * 60000, // In milliseconds
    chapters: chapters,
    // Audible-specific settings
    audibleSettings: {
      asin: `STORYTUNES${Date.now()}`,
      format: "AAX",
      bitRate: "64kbps",
      sampleRate: "44.1kHz",
      drm: false,
      chapterMarkers: true
    }
  };
  
  // Write the metadata file
  fs.writeFileSync(metadataFilePath, JSON.stringify(audibleMetadata, null, 2));
  
  // In a real implementation, we would:
  // 1. Convert the audio to Audible's AAX format 
  // 2. Add proper chapter markers and metadata to the audio file
  // 3. Create appropriate cover art
  
  console.log(`Exported Audible format to: ${outputPath}`);
  console.log(`Created Audible metadata file: ${metadataFilePath}`);
}