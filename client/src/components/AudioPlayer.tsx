import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, ExternalLink } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

export default function AudioPlayer({ audioUrl, className = "" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Create a direct download link that will work on mobile
  const openInNewTab = () => {
    window.open(audioUrl, '_blank');
  };

  return (
    <div className={`bg-purple rounded-2xl p-4 shadow text-white ${className}`}>
      <div className="flex flex-col items-center justify-center">
        <h4 className="font-heading font-bold text-center mb-4">Listen to Preview</h4>
        
        <div className="flex flex-col items-center space-y-4">
          {/* Native audio element with controls */}
          <audio 
            controls
            src={audioUrl}
            className="w-full max-w-md"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Your browser does not support the audio element.
          </audio>
          
          {/* External link option for devices that have trouble with embedded audio */}
          <Button
            onClick={openInNewTab}
            variant="outline"
            className="bg-white bg-opacity-20 text-white hover:bg-opacity-30 flex items-center gap-2"
          >
            <ExternalLink size={16} />
            <span>Open Audio in New Tab</span>
          </Button>
          
          <div className="audio-wave mt-2 flex items-center justify-center space-x-1">
            <div className="bar" style={{ height: isPlaying ? "15px" : "10px", width: "4px", backgroundColor: "white", borderRadius: "2px" }}></div>
            <div className="bar" style={{ height: isPlaying ? "20px" : "10px", width: "4px", backgroundColor: "white", borderRadius: "2px" }}></div>
            <div className="bar" style={{ height: isPlaying ? "12px" : "10px", width: "4px", backgroundColor: "white", borderRadius: "2px" }}></div>
            <div className="bar" style={{ height: isPlaying ? "25px" : "10px", width: "4px", backgroundColor: "white", borderRadius: "2px" }}></div>
            <div className="bar" style={{ height: isPlaying ? "18px" : "10px", width: "4px", backgroundColor: "white", borderRadius: "2px" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
