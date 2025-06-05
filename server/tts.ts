import * as fs from 'fs';
import * as path from 'path';
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// Map voice selection to OpenAI voice models
export function mapVoiceToOpenAI(voice: string): string {
  switch(voice) {
    case "Alloy (Female)":
      return "alloy";
    case "Echo (Male)":
      return "echo";
    case "Fable (Male)":
      return "fable";
    case "Onyx (Male)":
      return "onyx";
    case "Nova (Female)":
      return "nova";
    case "Shimmer (Female)":
      return "shimmer";
    default:
      return "alloy"; // default voice
  }
}

// Generate audio using OpenAI's TTS API
export async function generateAudio(text: string, voice: string): Promise<{ success: boolean; filePath: string; error?: string }> {
  try {
    // Ensure text isn't too long for OpenAI
    const truncatedText = text.substring(0, 4096);
    const openAIVoice = mapVoiceToOpenAI(voice);
    const timestamp = Date.now();
    
    // Make sure audio directory exists
    const audioDir = path.join(process.cwd(), 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileName = `${timestamp}.mp3`;
    const filePath = path.join(audioDir, fileName);
    
    // Call OpenAI TTS API
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: openAIVoice,
      input: truncatedText,
    });
    
    // Save the audio file
    const buffer = await mp3.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    return {
      success: true,
      filePath: `/api/stories/audio/${fileName}`
    };
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return {
      success: false,
      filePath: '',
      error: error.message || "Failed to generate audio"
    };
  }
}