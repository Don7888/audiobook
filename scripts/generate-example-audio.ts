import { generateAudio } from '../server/tts';
import fs from 'fs';
import path from 'path';

// Example story texts
const henryStoryText = `When space pirates steal Vesper's magical Golden Cat, young explorer Henry sets off in his starship to save the day. 

Henry zoomed through the starry galaxy in his green spaceship, his eyes sparkling with determination. "Don't worry, Vesper," he whispered to his friend. "I'll bring your Golden Cat home!"

The space pirates had hidden the precious cat on a distant purple planet. Henry carefully landed his ship and stepped out in his bright blue space suit. The Golden Cat meowed softly from inside a crystal cage.

"Meow, meow!" cried the Golden Cat, happy to see Henry.

Using his brave heart and the power of starlight, Henry outwitted the pirates and rescued the Golden Cat. Together, they flew back through the twinkling stars to reunite with Vesper.

The galaxy sparkled with joy once more, and Henry learned that even the smallest explorer can make the biggest difference when they follow their heart.`;

const alphabetStoryText = `Welcome to the magical Alphabet Jungle, where letters come alive and dance among the trees!

In this enchanted forest, the letter A skipped happily down the winding path. "A is for Adventure!" A sang cheerfully.

Soon, the letter B bounced by, full of energy. "B is for Bouncing!" B giggled as it hopped along.

The letter C curved gracefully around the colorful flowers. "C is for Colorful!" C called out to its friends.

D danced between the tall trees, while E explored every corner of the jungle. Each letter had its own special sound and personality.

The wise old owl in the tree hooted, "Hoo, hoo! Every letter has a special job to do!"

Together, all the alphabet friends learned that when they work together, they can spell wonderful words and tell amazing stories. The jungle echoed with their happy sounds as they played and learned throughout the magical day.`;

async function generateExampleAudio() {
  console.log('Generating audio for Henry The Space Explorer...');
  const henryResult = await generateAudio(henryStoryText, 'alloy');
  if (henryResult.success) {
    // Extract the actual file path from the result
    const actualPath = henryResult.filePath.replace('/api/stories/audio/', '/home/runner/workspace/audio/');
    const henryTargetPath = path.join(process.cwd(), '..', 'public', 'henry-space-explorer.mp3');
    
    if (fs.existsSync(actualPath)) {
      fs.copyFileSync(actualPath, henryTargetPath);
      console.log(`Henry audio saved to: ${henryTargetPath}`);
    } else {
      console.log(`Henry audio file not found at: ${actualPath}`);
    }
  } else {
    console.log(`Henry audio generation failed: ${henryResult.error}`);
  }

  console.log('Generating audio for Alphabet Jungle Adventure...');
  const alphabetResult = await generateAudio(alphabetStoryText, 'nova');
  if (alphabetResult.success) {
    // Extract the actual file path from the result
    const actualPath = alphabetResult.filePath.replace('/api/stories/audio/', '/home/runner/workspace/audio/');
    const alphabetTargetPath = path.join(process.cwd(), '..', 'public', 'alphabet-jungle-adventure.mp3');
    
    if (fs.existsSync(actualPath)) {
      fs.copyFileSync(actualPath, alphabetTargetPath);
      console.log(`Alphabet audio saved to: ${alphabetTargetPath}`);
    } else {
      console.log(`Alphabet audio file not found at: ${actualPath}`);
    }
  } else {
    console.log(`Alphabet audio generation failed: ${alphabetResult.error}`);
  }

  console.log('Example audio generation complete!');
}

generateExampleAudio().catch(console.error);