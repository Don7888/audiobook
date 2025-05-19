import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume } from "lucide-react";
import SoundEffectPlayer from "./SoundEffectPlayer";

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
  storyText?: string;
}

export default function AudioPlayer({ audioUrl, className = "", storyText = "" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      setCurrentTime(audio.currentTime);
    };

    const audioEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
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
