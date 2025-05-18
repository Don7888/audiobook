import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SoundEffect, SoundEffectPlacement } from "@shared/schema";
import { Play, Plus, X, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SoundEffectSelectorProps {
  audioUrl: string;
  duration: number;
  soundEffects: SoundEffectPlacement[];
  onChange: (soundEffects: SoundEffectPlacement[]) => void;
  suggestions?: Array<{ description: string; timing: string; }>;
}

export default function SoundEffectSelector({ 
  audioUrl, 
  duration, 
  soundEffects, 
  onChange,
  suggestions = []
}: SoundEffectSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTime, setSelectedTime] = useState<number>(0);
  const [selectedEffectId, setSelectedEffectId] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(1);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Query to fetch all sound effects
  const { data: allEffects = [], isLoading } = useQuery<SoundEffect[]>({
    queryKey: ['/api/sound-effects'],
    queryFn: async () => {
      const response = await fetch('/api/sound-effects');
      if (!response.ok) throw new Error('Failed to fetch sound effects');
      return response.json();
    }
  });

  // Get unique categories from sound effects
  const categories = ["All", ...new Set(allEffects.map(effect => effect.category))];

  // Filter effects by selected category
  const filteredEffects = selectedCategory === "All" 
    ? allEffects 
    : allEffects.filter(effect => effect.category === selectedCategory);

  // Initialize preview audio
  useEffect(() => {
    const audio = new Audio();
    setPreviewAudio(audio);
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Play a sound effect preview
  const playSoundPreview = (url: string) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.src = url;
      previewAudio.volume = volume;
      previewAudio.play().catch(err => {
        console.error("Error playing audio:", err);
        toast({
          title: "Audio Error",
          description: "Could not play sound effect",
          variant: "destructive"
        });
      });
    }
  };

  // Add a sound effect at the current time
  const addSoundEffect = () => {
    if (!selectedEffectId) {
      toast({
        title: "Selection Required",
        description: "Please select a sound effect first",
        variant: "destructive"
      });
      return;
    }

    const newEffect: SoundEffectPlacement = {
      soundEffectId: selectedEffectId,
      timestamp: selectedTime,
      volume
    };

    // Add to list
    const updatedEffects = [...soundEffects, newEffect];
    
    // Sort by timestamp
    updatedEffects.sort((a, b) => a.timestamp - b.timestamp);
    
    onChange(updatedEffects);
    toast({
      title: "Sound Effect Added",
      description: "Sound effect has been added to your story",
    });
  };

  // Remove a sound effect
  const removeSoundEffect = (index: number) => {
    const updatedEffects = [...soundEffects];
    updatedEffects.splice(index, 1);
    onChange(updatedEffects);
  };

  // Find a sound effect in the list by ID
  const findSoundEffect = (id: number) => {
    return allEffects.find(effect => effect.id === id);
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-6 bg-white rounded-xl p-5 shadow">
      <h3 className="font-heading font-bold text-xl mb-4">Add Sound Effects</h3>

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="add">Add Effects</TabsTrigger>
          <TabsTrigger value="list">Current Effects ({soundEffects.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add" className="space-y-4">
          {suggestions && suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Suggested Sound Effects:</h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded-lg text-sm">
                    <div className="font-medium">{suggestion.description}</div>
                    <div className="text-gray-600 text-xs">{suggestion.timing}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border rounded-lg p-4">
            <div className="mb-4">
              <label className="font-medium mb-2 block">Position in Story:</label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[selectedTime]}
                  max={duration || 600}
                  step={0.1}
                  onValueChange={(values) => setSelectedTime(values[0])}
                  className="flex-1"
                />
                <span className="min-w-16 text-center font-mono">{formatTime(selectedTime)}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="font-medium mb-2 block">Sound Category:</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <label className="font-medium mb-2 block">Sound Effect:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {isLoading ? (
                  <div className="col-span-full text-center p-4">Loading sound effects...</div>
                ) : filteredEffects.length === 0 ? (
                  <div className="col-span-full text-center p-4">No sound effects found</div>
                ) : (
                  filteredEffects.map(effect => (
                    <div 
                      key={effect.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedEffectId === effect.id ? 'border-primary bg-primary/10' : 'hover:border-gray-400'}`}
                      onClick={() => setSelectedEffectId(effect.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{effect.name}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSoundPreview(effect.url);
                          }}
                        >
                          <Play size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="font-medium mb-2 block">Volume:</label>
              <div className="flex items-center space-x-2">
                <Volume2 size={18} />
                <Slider
                  value={[volume]}
                  max={1}
                  min={0}
                  step={0.05}
                  className="flex-1"
                  onValueChange={(values) => setVolume(values[0])}
                />
                <span className="min-w-12 text-right">{Math.round(volume * 100)}%</span>
              </div>
            </div>
            
            <Button 
              onClick={addSoundEffect} 
              className="w-full mt-2 bg-purple text-white"
              disabled={!selectedEffectId}
            >
              <Plus className="mr-2" size={16} /> Add Sound Effect
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          {soundEffects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sound effects added yet
            </div>
          ) : (
            <div className="space-y-3">
              {soundEffects.map((effect, index) => {
                const soundEffect = findSoundEffect(effect.soundEffectId);
                return (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-secondary bg-opacity-10 text-secondary">
                        {formatTime(effect.timestamp)}
                      </Badge>
                      <span className="font-medium">{soundEffect?.name || 'Unknown Effect'}</span>
                      <Badge variant="outline" className="bg-gray-100">
                        {Math.round(effect.volume * 100)}%
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-primary"
                        onClick={() => soundEffect && playSoundPreview(soundEffect.url)}
                      >
                        <Play size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => removeSoundEffect(index)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}