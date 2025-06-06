import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const voices = [
  { name: "Alloy (Neutral)", description: "Balanced voice suitable for all stories" },
  { name: "Echo (Male)", description: "Clear male voice" },
  { name: "Fable (Male)", description: "Storytelling male voice" },
  { name: "Nova (Female)", description: "Warm female voice" },
  { name: "Onyx (Male)", description: "Deep male voice" },
  { name: "Shimmer (Female)", description: "Gentle female voice" },
  { name: "Ballad (Male)", description: "Melodic male voice" }
];

const sampleText = "I am your audiobook narrator";

export default function VoicePreview() {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  const playVoicePreview = async (voiceName: string) => {
    try {
      console.log("Playing voice preview for:", voiceName);
      
      // Stop any currently playing audio
      if (playingVoice === voiceName) {
        setPlayingVoice(null);
        return;
      }
      
      // Stop other playing audio
      if (playingVoice) {
        setPlayingVoice(null);
      }

      // Check if we already have cached audio URL for this voice
      let audioUrl = audioCache.get(voiceName);
      
      if (!audioUrl) {
        // Generate new audio for this voice
        setIsGenerating(voiceName);
        console.log("Generating audio for voice:", voiceName);
        
        const response = await fetch('/api/stories/generate-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sampleText,
            voice: voiceName,
            title: "Voice Preview"
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate voice preview');
        }

        const result = await response.json();
        audioUrl = result.audioUrl.startsWith('http') ? result.audioUrl : `${window.location.origin}${result.audioUrl}`;
        console.log("Audio generated, URL:", audioUrl);
        
        // Cache the URL
        setAudioCache(prev => new Map(prev.set(voiceName, audioUrl!)));
      }

      // Create fresh audio element with better error handling
      const audio = new Audio();
      setPlayingVoice(voiceName);
      
      // Set up event listeners before loading
      audio.addEventListener('loadstart', () => {
        console.log("Audio loading started for:", voiceName);
      });
      
      audio.addEventListener('canplay', () => {
        console.log("Audio can play for:", voiceName);
        audio.play().catch((playError: any) => {
          console.error("Play error after canplay:", playError);
          setPlayingVoice(null);
        });
      });
      
      audio.addEventListener('ended', () => {
        console.log("Audio ended for:", voiceName);
        setPlayingVoice(null);
      });
      
      audio.addEventListener('error', (e: any) => {
        console.error("Audio error for:", voiceName, e, audio.error);
        toast({
          title: "Audio Error",
          description: `Failed to load audio: ${audio.error?.message || 'Unknown error'}`,
          variant: "destructive"
        });
        setPlayingVoice(null);
      });

      // Load the audio source with fallback handling
      console.log("Loading audio for:", voiceName, "URL:", audioUrl);
      
      // Try different loading approaches for better compatibility
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      
      // Set source and load
      if (audioUrl) {
        audio.src = audioUrl;
        audio.load();
        
        // Fallback: try direct fetch and blob URL if initial load fails
        setTimeout(() => {
          if (audio.readyState === 0) {
            console.log("Trying blob URL fallback for:", voiceName);
            fetch(audioUrl)
              .then(response => response.blob())
              .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                audio.src = blobUrl;
                audio.load();
              })
              .catch(err => {
                console.error("Blob fallback failed:", err);
                setPlayingVoice(null);
              });
          }
        }, 2000);
      }
      
    } catch (error: any) {
      console.error("Voice preview error:", error);
      toast({
        title: "Preview Failed",
        description: error.message || "Failed to generate voice preview",
        variant: "destructive"
      });
      setPlayingVoice(null);
    } finally {
      setIsGenerating(null);
    }
  };

  const stopPlayback = () => {
    if (playingVoice) {
      setPlayingVoice(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Voice Preview
          </h1>
          <p className="text-lg text-gray-600">
            Listen to sample narrations from each voice to find your perfect storyteller
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Sample Text:</h3>
          <p className="text-gray-700 italic">
            "{sampleText}"
          </p>
          <div className="mt-3 text-sm text-gray-600">
            <p>If audio doesn't play, try refreshing the page or using a different browser.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {voices.map((voice) => (
            <Card key={voice.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{voice.name}</CardTitle>
                <CardDescription>{voice.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => playVoicePreview(voice.name)}
                  disabled={isGenerating === voice.name}
                  className="w-full"
                  variant={playingVoice === voice.name ? "secondary" : "default"}
                >
                  {isGenerating === voice.name ? (
                    <>
                      <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : playingVoice === voice.name ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Stop Preview
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Preview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {playingVoice && (
          <div className="fixed bottom-4 right-4">
            <Button onClick={stopPlayback} variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Stop All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}