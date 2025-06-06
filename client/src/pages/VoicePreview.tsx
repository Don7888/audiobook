import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { narratorVoiceEnum } from "@shared/schema";

const sampleText = "Hello! I'm your storyteller for today. Let me take you on a magical adventure filled with wonder, friendship, and exciting discoveries. Are you ready to explore?";

export default function VoicePreview() {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  const voices = narratorVoiceEnum.options;

  const handlePlayAudio = async (voiceName: string) => {
    try {
      // Stop any currently playing audio
      if (playingVoice !== null) {
        const currentAudio = document.getElementById(`voice-audio-${playingVoice}`) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      // Check if we already have cached audio URL for this voice
      let audioUrl = audioCache.get(voiceName);
      
      if (!audioUrl) {
        // Use the same audio generation logic as story narration
        setIsGenerating(voiceName);
        console.log("Generating voice sample:", voiceName);
        
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
        console.log("Generated voice sample:", audioUrl);
        
        // Cache the URL
        setAudioCache(prev => new Map(prev.set(voiceName, audioUrl!)));
        setIsGenerating(null);
      }

      // Use exact same playback method as ExampleStories
      const audio = document.getElementById(`voice-audio-${voiceName}`) as HTMLAudioElement;
      if (audio) {
        if (playingVoice === voiceName) {
          // If clicking the same voice, pause it
          audio.pause();
          setPlayingVoice(null);
        } else {
          // Play the new voice
          if (!audioUrl) {
            console.error("No audio URL available for:", voiceName);
            return;
          }
          console.log("Setting audio source:", audioUrl);
          audio.src = audioUrl;
          console.log("Starting audio playback for:", voiceName);
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log("Audio started successfully for:", voiceName);
              setPlayingVoice(voiceName);
            }).catch(error => {
              console.error("Audio play failed:", error);
              toast({
                title: "Playback Error",
                description: "Unable to play audio. Please try again.",
                variant: "destructive"
              });
            });
          } else {
            setPlayingVoice(voiceName);
          }

          // Reset when audio ends
          audio.onended = () => {
            console.log("Audio ended for:", voiceName);
            setPlayingVoice(null);
          };
          
          // Add error handler
          audio.onerror = (e) => {
            console.error("Audio error:", e);
            setPlayingVoice(null);
          };
        }
      } else {
        console.error("Audio element not found for:", voiceName);
      }
      
    } catch (error: any) {
      console.error("Voice preview error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate voice preview",
        variant: "destructive"
      });
      setIsGenerating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Voice Preview
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Listen to different narrator voices to find the perfect storyteller for your audiobooks. 
              Each voice has its own unique personality and style.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {voices.map((voice) => (
              <Card key={voice} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{voice}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-4">
                        "{sampleText.substring(0, 60)}..."
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    {isGenerating === voice ? (
                      <Button disabled className="w-full">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => handlePlayAudio(voice)}
                          className="w-full"
                          variant={playingVoice === voice ? "secondary" : "default"}
                        >
                          {playingVoice === voice ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Playing
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Preview Voice
                            </>
                          )}
                        </Button>
                        <audio id={`voice-audio-${voice}`} preload="metadata">
                          <source src="" type="audio/mpeg" />
                        </audio>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Ready to Create Your Story?
                </h3>
                <p className="text-blue-700 mb-4">
                  Once you've found your favorite voice, head back to the story creator to generate your personalized audiobook.
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Story
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}