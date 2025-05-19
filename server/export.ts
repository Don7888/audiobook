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
 * Exports stories in Yoto format
 */
async function exportYoto(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  // In a real implementation, this would create a Yoto-compatible format
  // For demo purposes, we'll use the same MP3 export
  await exportMp3(stories, outputPath);
  console.log(`Exported Yoto format to: ${outputPath}`);
}

/**
 * Exports stories in Toniebox format
 */
async function exportToniebox(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  // In a real implementation, this would create a Toniebox-compatible format
  // For demo purposes, we'll use the same MP3 export
  await exportMp3(stories, outputPath);
  console.log(`Exported Toniebox format to: ${outputPath}`);
}

/**
 * Exports stories in Audible format
 */
async function exportAudible(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  // In a real implementation, this would create an Audible-compatible format
  // For demo purposes, we'll use the same MP3 export
  await exportMp3(stories, outputPath);
  console.log(`Exported Audible format to: ${outputPath}`);
}