import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

export default function AudioPlayer({ audioUrl, className = "" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Reset state when audioUrl changes
    setIsPlaying(false);
    setCurrentTime(0);
    
    // Set up event listeners if audio element exists
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener("loadedmetadata", () => {
        setDuration(audioElement.duration || 0);
      });
      
      audioElement.addEventListener("timeupdate", () => {
        setCurrentTime(audioElement.currentTime || 0);
      });
      
      audioElement.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      // Load the new audio
      audioElement.load();
    }
    
    return () => {
      // Clean up event listeners
      if (audioElement) {
        audioElement.pause();
        audioElement.removeEventListener("loadedmetadata", () => {});
        audioElement.removeEventListener("timeupdate", () => {});
        audioElement.removeEventListener("ended", () => {});
      }
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Create a play promise to handle autoplay restrictions
      const playPromise = audioRef.current.play();
      
      // Handle potential play() rejection (due to browser autoplay policy)
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
          })
          .catch(error => {
            // Auto-play was prevented
            console.error("Playback prevented:", error);
            setIsPlaying(false);
          });
      }
    }
    
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-purple rounded-2xl p-4 shadow text-white ${className}`}>
      {/* Hidden audio element that will be controlled by our custom UI */}
      <audio ref={audioRef} preload="metadata" className="hidden">
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-heading font-bold">Listen to Preview</h4>
        <span className="text-sm">
          {formatTime(currentTime)} / {formatTime(duration || 0)}
        </span>
      </div>
      
      <Slider
        value={[currentTime]}
        max={duration || 100}
        step={0.01}
        className="mb-4"
        onValueChange={handleSliderChange}
      />
      
      <div className="flex justify-between items-center">
        <Button 
          onClick={skipBackward}
          variant="ghost" 
          size="icon"
          className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all text-white"
        >
          <SkipBack size={18} />
        </Button>
        
        <Button 
          onClick={togglePlayPause}
          variant="ghost" 
          size="icon"
          className="w-14 h-14 bg-white text-purple rounded-full flex items-center justify-center hover:bg-gray-100 transition-all"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </Button>
        
        <Button 
          onClick={skipForward}
          variant="ghost" 
          size="icon"
          className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all text-white"
        >
          <SkipForward size={18} />
        </Button>
        
        <div className="audio-wave">
          <div className="bar" style={{ height: isPlaying ? "15px" : "10px" }}></div>
          <div className="bar" style={{ height: isPlaying ? "20px" : "10px" }}></div>
          <div className="bar" style={{ height: isPlaying ? "12px" : "10px" }}></div>
          <div className="bar" style={{ height: isPlaying ? "25px" : "10px" }}></div>
          <div className="bar" style={{ height: isPlaying ? "18px" : "10px" }}></div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Volume2 size={18} />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            className="w-20"
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
}
