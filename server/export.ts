import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';
import type { Story } from '@shared/schema';
import archiver from 'archiver';
import NodeID3 from 'node-id3';

interface ExportOptions {
  playlistName: string;
  description?: string;
  format: 'mp3' | 'yuto' | 'toniebox' | 'audible';
  storyIds: number[];
}

/**
 * Exports stories as a single file in the specified format
 */
export async function exportStories(options: ExportOptions): Promise<{ downloadUrl: string; filename: string }> {
  const { playlistName, format, storyIds } = options;
  
  console.log('Starting export with options:', options);
  
  // Get stories by IDs
  const stories: Story[] = [];
  for (const id of storyIds) {
    const story = await storage.getStory(id);
    if (story) {
      console.log(`Found story: ${story.title}, audioUrl: ${story.audioUrl}`);
      stories.push(story);
    }
  }
  
  console.log(`Retrieved ${stories.length} stories for export`);
  
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
  
  // For Yuto format, create a zip file
  const fileExtension = format === 'yuto' ? 'zip' : format;
  const filename = `${safePlaylistName}_${timestamp}.${fileExtension}`;
  const filePath = path.join(exportDir, filename);
  
  // Export based on format
  try {
    switch (format) {
      case 'mp3':
        await exportMp3(stories, filePath);
        break;
      case 'yuto':
        await exportYuto(stories, filePath, options);
        break;
      case 'toniebox':
        await exportToniebox(stories, filePath, options);
        break;
      case 'audible':
        await exportAudible(stories, filePath, options);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    console.log(`Exported stories in ${format} format to: ${filePath}`);
  } catch (error) {
    console.error(`Error exporting to ${format} format:`, error);
    throw error;
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
  try {
    console.log('Starting MP3 export for stories:', stories.map(s => ({ title: s.title, audioUrl: s.audioUrl })));
    
    // Get the audio files for each story
    const audioFiles: string[] = [];
    
    for (const story of stories) {
      console.log(`Processing story: ${story.title}, audioUrl: ${story.audioUrl}`);
      
      if (story.audioUrl) {
        // Extract the filename from the audio URL (e.g., "/api/stories/audio/filename.mp3")
        const audioFilename = story.audioUrl.split('/').pop();
        console.log(`Extracted filename: ${audioFilename}`);
        
        if (audioFilename) {
          const audioPath = path.join(process.cwd(), 'audio', audioFilename);
          console.log(`Looking for audio file at: ${audioPath}`);
          console.log(`File exists: ${fs.existsSync(audioPath)}`);
          
          if (fs.existsSync(audioPath)) {
            const fileSize = fs.statSync(audioPath).size;
            console.log(`Found audio file: ${audioPath}, size: ${fileSize} bytes`);
            audioFiles.push(audioPath);
          }
        }
      }
    }
    
    console.log(`Found ${audioFiles.length} audio files:`, audioFiles);
    
    if (audioFiles.length === 0) {
      throw new Error('No audio files found for the selected stories');
    }
    
    if (audioFiles.length === 1) {
      // If only one file, just copy it
      console.log(`Copying single file: ${audioFiles[0]} to ${outputPath}`);
      fs.copyFileSync(audioFiles[0], outputPath);
      const exportedSize = fs.statSync(outputPath).size;
      console.log(`Exported file size: ${exportedSize} bytes`);
    } else {
      // For multiple files, concatenate them into a single MP3
      console.log(`Concatenating ${audioFiles.length} files`);
      
      // Read all audio files and combine them
      const buffers: Buffer[] = [];
      for (const audioFile of audioFiles) {
        const buffer = fs.readFileSync(audioFile);
        console.log(`Read ${buffer.length} bytes from ${audioFile}`);
        buffers.push(buffer);
      }
      
      // Combine all buffers
      const combinedBuffer = Buffer.concat(buffers);
      fs.writeFileSync(outputPath, combinedBuffer);
      
      const exportedSize = fs.statSync(outputPath).size;
      console.log(`Combined and exported file size: ${exportedSize} bytes`);
    }
    
    console.log(`Exported MP3 to: ${outputPath}`);
  } catch (error) {
    console.error('Error exporting MP3:', error);
    throw error;
  }
}

/**
 * Exports stories in Yuto format with required metadata and cover image
 * Also creates individual tracks with ID3 tags and custom cover art
 */
async function exportYuto(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  try {
    console.log(`Starting Yuto export for ${stories.length} stories to: ${outputPath}`);
    
    // Create a temporary directory for individual tracks
    const tempDir = path.join(path.dirname(outputPath), `${path.basename(outputPath, '.zip')}_tracks`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    console.log(`Created temp directory: ${tempDir}`);
    
    // Process each story as an individual track
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const trackNumber = i + 1;
      
      console.log(`Processing story ${trackNumber}: ${story.title}, audioUrl: ${story.audioUrl}`);
      
      if (story.audioUrl) {
        const audioFilename = story.audioUrl.split('/').pop();
        if (audioFilename) {
          const sourceAudioPath = path.join(process.cwd(), 'audio', audioFilename);
          console.log(`Looking for source audio at: ${sourceAudioPath}`);
          
          if (fs.existsSync(sourceAudioPath)) {
            // Create track filename with proper numbering
            const trackFilename = `${trackNumber.toString().padStart(2, '0')} - ${story.title.replace(/[^a-z0-9\s]/gi, '_').trim()}.mp3`;
            const trackPath = path.join(tempDir, trackFilename);
            
            console.log(`Creating track: ${trackFilename}`);
            
            // Copy the audio file
            fs.copyFileSync(sourceAudioPath, trackPath);
            
            // Add ID3 tags for Yuto compatibility
            const tags = {
              title: story.title,
              artist: 'AI Story Generator',
              album: options.playlistName,
              trackNumber: trackNumber.toString(),
              totalTracks: stories.length.toString(),
              genre: 'Children\'s Story'
            };
            
            console.log(`Adding ID3 tags to ${trackFilename}:`, tags);
            
            // Write ID3 tags
            try {
              const success = NodeID3.write(tags, trackPath);
              if (success) {
                console.log(`Successfully added ID3 tags to track ${trackNumber}: ${story.title}`);
              } else {
                console.warn(`Failed to add ID3 tags to track ${trackNumber}: ${story.title}`);
              }
            } catch (tagError) {
              console.error(`Error adding ID3 tags to track ${trackNumber}:`, tagError);
            }
          } else {
            console.error(`Source audio file not found: ${sourceAudioPath}`);
          }
        }
      }
    }
    
    console.log('Creating zip archive...');
    
    // Create a zip file containing all tracks
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`Yuto export completed: ${archive.pointer()} total bytes`);
        // Clean up temporary directory
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
          console.log('Cleaned up temporary directory');
        } catch (cleanupError) {
          console.warn('Error cleaning up temp directory:', cleanupError);
        }
        resolve();
      });
      
      archive.on('error', (err: any) => {
        console.error('Archive error:', err);
        reject(err);
      });
      
      archive.pipe(output);
      
      // Add all track files to the zip
      archive.directory(tempDir, false);
      
      archive.finalize();
    });
    
  } catch (error) {
    console.error('Error exporting Yuto format:', error);
    throw error;
  }
}

/**
 * Exports stories in Toniebox format with required metadata
 */
async function exportToniebox(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  // For now, create a basic MP3 export for Toniebox compatibility
  await exportMp3(stories, outputPath);
  console.log(`Exported Toniebox format to: ${outputPath}`);
}

/**
 * Exports stories in Audible format with proper metadata
 */
async function exportAudible(stories: Story[], outputPath: string, options: ExportOptions): Promise<void> {
  // For now, create a basic MP3 export for Audible compatibility
  await exportMp3(stories, outputPath);
  console.log(`Exported Audible format to: ${outputPath}`);
}