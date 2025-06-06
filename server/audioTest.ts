import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function generateTestAudio() {
  try {
    const audioDir = path.join(process.cwd(), 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Generate test audio with different formats
    const testText = "I am your audiobook narrator";
    const timestamp = Date.now();

    // Try different response formats
    const formats = ['mp3', 'opus', 'aac'];
    
    for (const format of formats) {
      try {
        console.log(`Generating test audio in ${format} format...`);
        
        const audio = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: testText,
          response_format: format as any
        });

        const buffer = await audio.arrayBuffer();
        const fileName = `test_${timestamp}.${format}`;
        const filePath = path.join(audioDir, fileName);
        
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`Test audio saved: ${fileName} (${buffer.byteLength} bytes)`);
        
        return {
          success: true,
          format,
          fileName,
          path: `/api/stories/audio/${fileName}`
        };
      } catch (err) {
        console.error(`Failed to generate ${format}:`, err);
      }
    }

    throw new Error("All audio formats failed");
  } catch (error) {
    console.error("Test audio generation failed:", error);
    return { success: false, error: error.message };
  }
}