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

const sampleText = "Once upon a time, in a magical forest, there lived a brave little hamster named Henry. He loved exploring and going on exciting adventures with his friends.";

export default function VoicePreview() {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());
  const { toast } = useToast();

  const playVoicePreview = async (voiceName: string) => {
    try {
      // Stop any currently playing audio
      if (playingVoice) {
        const currentAudio = audioElements.get(playingVoice);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        setPlayingVoice(null);
      }

      // If clicking the same voice while it's playing, just stop
      if (playingVoice === voiceName) {
        return;
      }

      // Check if we already have audio for this voice
      let audio = audioElements.get(voiceName);
      
      if (!audio) {
        // Generate new audio for this voice
        setIsGenerating(voiceName);
        
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
        
        // Create audio element
        audio = new Audio(result.audioUrl);
        const newMap = new Map(audioElements);
        newMap.set(voiceName, audio);
        setAudioElements(newMap);
        
        // Set up event listeners
        audio.addEventListener('ended', () => {
          setPlayingVoice(null);
        });
        
        audio.addEventListener('error', () => {
          toast({
            title: "Playback Error",
            description: "Failed to play voice preview",
            variant: "destructive"
          });
          setPlayingVoice(null);
        });
      }

      // Play the audio
      if (audio) {
        setPlayingVoice(voiceName);
        await audio.play();
      }
      
    } catch (error) {
      console.error("Voice preview error:", error);
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Failed to generate voice preview",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const stopPlayback = () => {
    if (playingVoice) {
      const audio = audioElements.get(playingVoice);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
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