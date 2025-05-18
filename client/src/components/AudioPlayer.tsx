import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

export default function AudioPlayer({ audioUrl, className = "" }: AudioPlayerProps) {
  // Create a direct download link that will work on mobile
  const openInNewTab = () => {
    window.open(audioUrl, '_blank');
  };
  
  // Extract the filename for download
  const filename = audioUrl.split('/').pop() || 'story-audio.mp3';

  return (
    <div className={`bg-purple rounded-2xl p-4 shadow text-white ${className}`}>
      <div className="flex flex-col items-center justify-center">
        <h4 className="font-heading font-bold text-center mb-4">Listen to Preview</h4>
        
        <div className="flex flex-col items-center space-y-4">
          {/* Native audio element with standard controls that work cross-browser */}
          <audio 
            controls
            src={audioUrl} 
            className="w-full max-w-md"
          >
            Your browser does not support the audio element.
          </audio>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            {/* Direct link to audio in new tab */}
            <Button
              onClick={openInNewTab}
              variant="outline"
              className="bg-white bg-opacity-20 text-white hover:bg-opacity-30 flex items-center gap-2"
            >
              <ExternalLink size={16} />
              <span>Open in New Tab</span>
            </Button>
            
            {/* Direct download link (always works) */}
            <a 
              href={audioUrl} 
              download={filename}
              className="no-underline"
            >
              <Button
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white w-full flex items-center gap-2"
              >
                <Download size={16} />
                <span>Download Audio</span>
              </Button>
            </a>
          </div>
          
          <p className="text-xs text-center mt-2 opacity-80">
            If the player isn't working, please use the download button to hear the audio.
          </p>
        </div>
      </div>
    </div>
  );
}
