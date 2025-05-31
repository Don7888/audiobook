import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume } from "lucide-react";
import SoundEffectPlayer from "./SoundEffectPlayer";

interface SoundEffectTiming {
  effectName: string;
  timestamp: number;
  duration: number;
}

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
  storyText?: string;
  soundEffectTimings?: SoundEffectTiming[];
}

export default function AudioPlayer({ audioUrl, className = "", storyText = "", soundEffectTimings = [] }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playedEffects, setPlayedEffects] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const soundEffectAudios = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Create a direct URL for the audio file using our static audio serving route
  // Replace /api/stories/audio/ with /audio/ to match our Express static serving
  const directAudioUrl = audioUrl.replace('/api/stories/audio/', '/audio/');

  // Set up audio element and time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setupAudio = () => {
      setDuration(audio.duration);
    };

    const updateTime = () => {
      const newTime = audio.currentTime;
      setCurrentTime(newTime);
      
      // Check if any sound effects should be triggered at this time
      soundEffectTimings.forEach((timing, index) => {
        if (!playedEffects.has(index) && 
            newTime >= timing.timestamp && 
            newTime <= timing.timestamp + 0.5) { // 0.5 second window
          
          // Find and play the corresponding sound effect
          const soundAudio = soundEffectAudios.current.get(timing.effectName);
          if (soundAudio) {
            soundAudio.currentTime = 0;
            soundAudio.play().catch(console.error);
            setPlayedEffects(prev => new Set(prev).add(index));
          }
        }
      });
    };

    const audioEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayedEffects(new Set()); // Reset played effects for replay
    };

    audio.addEventListener('loadedmetadata', setupAudio);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', audioEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setupAudio);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', audioEnded);
    };
  }, []);

  // Initialize sound effect audio elements
  useEffect(() => {
    // Create a mapping from effect names to actual file paths
    const effectNameMapping: Record<string, string> = {
      'rain': '/sounds/Weather/rain.mp3',
      'Rain': '/sounds/Weather/rain.mp3',
      'meow': '/sounds/Animals/meow.mp3',
      'cat': '/sounds/Animals/meow.mp3',
      'woof': '/sounds/Animals/woof.mp3',
      'dog': '/sounds/Animals/woof.mp3',
      'bark': '/sounds/Animals/woof.mp3',
      'Sea': '/sounds/Environment/Sea.mp3',
      'ocean': '/sounds/Environment/Sea.mp3',
      'water': '/sounds/Environment/Sea.mp3',
      'Twinkle': '/sounds/Fantasy/Twinkle.mp3',
      'twinkle': '/sounds/Fantasy/Twinkle.mp3',
      'stars': '/sounds/Fantasy/Twinkle.mp3',
      'magic_twinkle': '/sounds/Fantasy/magic_twinkle.mp3',
      'magic': '/sounds/Fantasy/magic_twinkle.mp3',
      'rocket': '/sounds/Fantasy/rocket.mp3',
      'space': '/sounds/Fantasy/rocket.mp3',
      'creak door': '/sounds/Household/creak door.mp3',
      'door': '/sounds/Household/creak door.mp3',
      'door slam': '/sounds/Household/door slam.mp3',
      'slam': '/sounds/Household/door slam.mp3',
      'child laugh': '/sounds/Human/child laugh.mp3',
      'laugh': '/sounds/Human/child laugh.mp3',
      'giggle': '/sounds/Human/child laugh.mp3'
    };

    soundEffectTimings.forEach((timing) => {
      if (!soundEffectAudios.current.has(timing.effectName)) {
        // Find the correct file path for this effect
        const effectPath = effectNameMapping[timing.effectName] || 
                          effectNameMapping[timing.effectName.toLowerCase()];
        
        if (effectPath) {
          const audio = new Audio(effectPath);
          audio.volume = 0.7; // Slightly lower volume than main narration
          soundEffectAudios.current.set(timing.effectName, audio);
        } else {
          console.warn(`No sound file found for effect: ${timing.effectName}`);
        }
      }
    });

    // Cleanup when component unmounts
    return () => {
      soundEffectAudios.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      soundEffectAudios.current.clear();
    };
  }, [soundEffectTimings]);

  // Format time in minutes:seconds
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.error("Play error:", err);
            // Play in new tab as fallback
            window.open(directAudioUrl, '_blank');
          });
      }
    }
  };

  return (
    <div className={`bg-purple rounded-2xl p-4 shadow text-white ${className}`}>
      <h4 className="font-heading font-bold text-center mb-4">Listen to Story</h4>
      
      <audio 
        ref={audioRef}
        src={directAudioUrl}
        preload="metadata" 
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-3">
        {/* Simple player UI */}
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-2">
          <div 
            className="bg-white h-2 rounded-full" 
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between w-full">
          <span className="text-sm">{formatTime(currentTime)}</span>
          
          <Button
            onClick={togglePlay}
            variant="outline"
            className="bg-white text-purple rounded-full w-12 h-12 flex items-center justify-center"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
          </Button>
          
          <span className="text-sm">{formatTime(duration)}</span>
        </div>
        
        {/* Sound Effect Player component */}
        {storyText && (
          <SoundEffectPlayer 
            storyText={storyText} 
            isPlaying={isPlaying} 
            currentTime={currentTime} 
          />
        )}
        
        <p className="text-xs text-center mt-2 opacity-80">
          AI-generated voice narration using OpenAI's TTS
        </p>
      </div>
    </div>
  );
}
