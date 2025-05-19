import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SoundEffect } from '@shared/schema';

interface SoundEffectPlayerProps {
  storyText: string;
  isPlaying: boolean;
  currentTime: number;
}

export default function SoundEffectPlayer({ storyText, isPlaying, currentTime }: SoundEffectPlayerProps) {
  const [soundEffects, setSoundEffects] = useState<{name: string, timestamp: number}[]>([]);
  const [lastPlayedEffect, setLastPlayedEffect] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Fetch all available sound effects from the server
  const { data: availableSoundEffects = [] } = useQuery<SoundEffect[]>({
    queryKey: ['/api/sound-effects'],
    queryFn: async () => {
      const response = await fetch('/api/sound-effects');
      if (!response.ok) throw new Error('Failed to fetch sound effects');
      return response.json();
    },
  });

  // Extract all sound effects from the story text
  useEffect(() => {
    // Use regex to find all [SFX:name] tags
    const regex = /\[SFX:([^\]]+)\]/g;
    const effects = [];
    const paragraphs = storyText.split('\n\n');
    
    let cumulativeLength = 0;
    let match;
    
    // Calculate approximate timestamps for each sound effect
    for (const paragraph of paragraphs) {
      const paragraphLength = paragraph.length;
      
      // Reset the regex for each paragraph
      regex.lastIndex = 0;
      
      while ((match = regex.exec(paragraph)) !== null) {
        // Calculate a timestamp based on the position of the sound effect in the text
        // Position is relative within paragraph (0-1)
        const effectPosition = match.index / paragraphLength;
        
        // Calculate better timestamp with higher words-per-second rate for more realistic timing
        // Average reading speed is about 150-200 words per minute, or about 2.5-3.3 words per second
        // Assuming an average of 5 characters per word, that's roughly 12-17 characters per second
        const charactersPerSecond = 12;
        const timestamp = cumulativeLength + (effectPosition * (paragraphLength / charactersPerSecond));
        
        effects.push({
          name: match[1].trim(),
          timestamp: timestamp
        });
      }
      
      // Adjust the paragraph timing to match the same charactersPerSecond rate used above
      const charactersPerSecond = 12;
      cumulativeLength += (paragraphLength / charactersPerSecond) + 1; // +1 second pause between paragraphs
    }
    
    setSoundEffects(effects);
  }, [storyText]);

  // Play sound effects at the appropriate time
  useEffect(() => {
    if (!isPlaying) return;
    
    // Check if there's a sound effect that should play at the current time
    const effectToPlay = soundEffects.find(effect => {
      return currentTime >= effect.timestamp && 
             currentTime <= effect.timestamp + 0.5 && // Half second window
             lastPlayedEffect !== effect.timestamp;
    });
    
    if (effectToPlay) {
      // Find the actual sound effect file from available effects
      const matchingEffect = availableSoundEffects.find(se => 
        se.name.toLowerCase() === effectToPlay.name.toLowerCase() ||
        se.name.toLowerCase().includes(effectToPlay.name.toLowerCase()) ||
        effectToPlay.name.toLowerCase().includes(se.name.toLowerCase())
      );
      
      if (matchingEffect && matchingEffect.url) {
        // Play the sound effect
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        
        audioRef.current = new Audio(matchingEffect.url);
        audioRef.current.volume = 0.0; // Start with zero volume for fade-in
        audioRef.current.loop = true; // Loop the sound effect
        
        // Play the sound with 5 second duration including fade in/out
        const fadeInDuration = 1000; // 1 second fade in
        const sustainDuration = 3000; // 3 seconds at full volume
        const fadeOutDuration = 1000; // 1 second fade out
        const maxVolume = 0.7; // Maximum volume (slightly lower than narration)
        
        let startTime = Date.now();
        
        // Create the fade effect with requestAnimationFrame
        const fadeAudio = () => {
          if (!audioRef.current) return;
          
          const elapsed = Date.now() - startTime;
          
          // Fade in period
          if (elapsed < fadeInDuration) {
            audioRef.current.volume = maxVolume * (elapsed / fadeInDuration);
          }
          // Sustain period
          else if (elapsed < fadeInDuration + sustainDuration) {
            audioRef.current.volume = maxVolume;
          }
          // Fade out period
          else if (elapsed < fadeInDuration + sustainDuration + fadeOutDuration) {
            const fadeOutElapsed = elapsed - (fadeInDuration + sustainDuration);
            audioRef.current.volume = maxVolume * (1 - (fadeOutElapsed / fadeOutDuration));
          }
          // End of effect
          else {
            audioRef.current.pause();
            audioRef.current.loop = false;
            return;
          }
          
          // Continue the animation
          requestAnimationFrame(fadeAudio);
        };
        
        // Start playback and fading
        audioRef.current.play()
          .then(() => {
            requestAnimationFrame(fadeAudio);
          })
          .catch(error => console.error('Error playing sound effect:', error));
        
        // Mark this effect as played so it doesn't repeat
        setLastPlayedEffect(effectToPlay.timestamp);
      }
    }
  }, [isPlaying, currentTime, soundEffects, lastPlayedEffect, availableSoundEffects]);

  // Reset last played effect when playback stops
  useEffect(() => {
    if (!isPlaying) {
      setLastPlayedEffect(null);
    }
  }, [isPlaying]);

  return null; // This component doesn't render anything visible
}