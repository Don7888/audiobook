import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { StoryGeneration, storyGenerationSchema, SoundEffectPlacement, type Character } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, BookOpen, Headphones, VolumeX, Volume2, Loader2, LogIn, UserPlus } from "lucide-react";
import { generateStory, generateAudio, GeneratedStory } from "@/lib/openai";
import StoryPreview from "./StoryPreview";
import SoundEffectSelector from "./SoundEffectSelector";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";

interface StoryCreatorProps {
  onStoryGenerated?: (story: GeneratedStory, audio: string, soundEffects?: SoundEffectPlacement[]) => void;
  userId?: number;
}

export default function StoryCreator({ onStoryGenerated }: StoryCreatorProps) {
  const [activeTab, setActiveTab] = useState("prompt");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [soundEffects, setSoundEffects] = useState<SoundEffectPlacement[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [soundEffectSuggestions, setSoundEffectSuggestions] = useState<Array<{ description: string; timing: string; }>>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
  const { toast } = useToast();
  const { user, isAuthenticated, userId } = useAuth();

  // Fetch subscription plans to check features
  const { data: subscriptionPlans } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json();
    },
  });

  // Fetch user data to check subscription tier
  const { data: userData } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!userId,
  });
  
  // Fetch user's characters
  const { data: userCharacters = [] } = useQuery({
    queryKey: ['/api/characters'],
    queryFn: async () => {
      if (!isAuthenticated || !userId) return [];
      
      try {
        const response = await fetch('/api/characters', {
          headers: {
            'user-id': userId.toString()
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch characters');
        return response.json();
      } catch (error) {
        console.error('Error fetching characters:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!userId
  });

  // Get the user's subscription tier and whether they can use sound effects
  const userSubscriptionTier = userData?.subscriptionTier || user?.subscriptionTier || 'basic';
  console.log("User subscription tier:", userSubscriptionTier);
  console.log("Subscription plans:", subscriptionPlans);
  
  // Check if the user can use sound effects based on their subscription tier
  const canUseSoundEffects = 
    userSubscriptionTier === 'pro' || 
    userSubscriptionTier === 'premium' || 
    (subscriptionPlans && subscriptionPlans[userSubscriptionTier]?.allowSoundEffects === true);

  const form = useForm<StoryGeneration>({
    resolver: zodResolver(storyGenerationSchema),
    defaultValues: {
      prompt: "",
      ageRange: "3-5 years",
      storyLength: "Short (2-3 min)",
      storyType: "Adventure",
      narrator: "Female - Gentle",
      includeSoundEffects: false
    }
  });

  const handleGenerateStory = async (data: StoryGeneration) => {
    try {
      if (!isAuthenticated || !userId) {
        toast({
          title: "Authentication Required",
          description: "You need to sign in to create stories",
          variant: "destructive"
        });
        return;
      }
      
      setIsGenerating(true);
      
      // Add user ID and selected characters
      const storyParams = {
        ...data,
        userId: userId,
        characterIds: selectedCharacters.length > 0 ? selectedCharacters : undefined
      };
      
      // Find character details for selected characters to include in prompt
      if (selectedCharacters.length > 0) {
        const characterDetails = selectedCharacters.map(id => {
          const character = userCharacters.find((c: Character) => c.id === id);
          return character ? `Character ${character.name}: ${character.appearance}. Personality: ${character.personality}` : '';
        }).filter(Boolean).join('\n\n');
        
        // Append character information to the prompt
        if (characterDetails) {
          storyParams.prompt = `${storyParams.prompt}\n\nPlease include the following characters in the story:\n${characterDetails}`;
        }
      }
      
      // Generate the story text
      const storyResponse = await generateStory(storyParams);
      setGeneratedStory(storyResponse);
      
      // Store sound effect suggestions if available
      if (storyResponse.soundEffectSuggestions) {
        setSoundEffectSuggestions(storyResponse.soundEffectSuggestions);
      }
      
      // Generate audio for the story
      const audioUrl = await generateAudio(storyResponse.content, data.narrator);
      setAudioUrl(audioUrl);
      
      // Estimate audio duration (1 character ≈ 0.1 seconds)
      const estimatedDuration = storyResponse.content.length * 0.1;
      setAudioDuration(estimatedDuration);
      
      // Reset sound effects
      setSoundEffects([]);
      
      // Update active tab
      setActiveTab("preview");
      
      // Notify parent component if callback provided
      if (onStoryGenerated) {
        onStoryGenerated(storyResponse, audioUrl);
      }
      
      toast({
        title: "Story Generated!",
        description: "Your story has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSoundEffectsChange = (newEffects: SoundEffectPlacement[]) => {
    setSoundEffects(newEffects);
  };

  return (
    <section id="create" className="py-16 bg-blue-50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-center mb-12">Create Your Audiobook</h2>
        
        {!isAuthenticated ? (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-4xl mx-auto p-8 text-center">
            <div className="mb-6">
              <LogIn className="mx-auto h-16 w-16 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Sign In Required</h3>
              <p className="text-gray-600 mb-6">
                You need to sign in to create and save your own audiobooks. 
                Sign in now to unlock all the storytelling features.
              </p>
              <Link href="/signin">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
            </p>
          </div>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-4xl mx-auto"
          >
          <TabsList className="flex w-full h-auto border-b">
            <TabsTrigger 
              value="prompt" 
              className="flex-1 py-4 font-heading font-semibold text-lg data-[state=active]:text-primary data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none"
            >
              <Wand2 className="mr-2" /> Story Prompt
            </TabsTrigger>
            <TabsTrigger 
              value="edit" 
              className="flex-1 py-4 font-heading font-semibold text-lg data-[state=active]:text-primary data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none"
              disabled={!generatedStory}
            >
              <BookOpen className="mr-2" /> Edit Story
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="flex-1 py-4 font-heading font-semibold text-lg data-[state=active]:text-primary data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none"
              disabled={!generatedStory}
            >
              <Headphones className="mr-2" /> Audio Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompt" className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateStory)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block font-heading font-semibold mb-2 text-lg">Describe your story idea:</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200"
                          placeholder="For example: A young dragon who can't breathe fire goes on an adventure to find his special talent"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="ageRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block font-heading font-semibold mb-2">Age Range:</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200">
                              <SelectValue placeholder="Select age range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3-5 years">3-5 years</SelectItem>
                            <SelectItem value="6-8 years">6-8 years</SelectItem>
                            <SelectItem value="9-12 years">9-12 years</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="storyLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block font-heading font-semibold mb-2">Story Length:</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200">
                              <SelectValue placeholder="Select story length" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Short (2-3 min)">Short (2-3 min)</SelectItem>
                            <SelectItem value="Medium (5-7 min)">Medium (5-7 min)</SelectItem>
                            <SelectItem value="Long (10-15 min)">Long (10-15 min)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="storyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block font-heading font-semibold mb-2">Story Type:</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200">
                              <SelectValue placeholder="Select story type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Adventure">Adventure</SelectItem>
                            <SelectItem value="Fantasy">Fantasy</SelectItem>
                            <SelectItem value="Educational">Educational</SelectItem>
                            <SelectItem value="Bedtime">Bedtime</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="narrator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block font-heading font-semibold mb-2">Narrator Voice:</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200">
                              <SelectValue placeholder="Select narrator voice" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Female - Gentle">Female - Gentle</SelectItem>
                            <SelectItem value="Male - Cheerful">Male - Cheerful</SelectItem>
                            <SelectItem value="Female - Animated">Female - Animated</SelectItem>
                            <SelectItem value="Male - Storyteller">Male - Storyteller</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="includeSoundEffects"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="font-heading font-semibold">
                          Include Sound Effects
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {canUseSoundEffects 
                            ? "Get AI suggestions for sound effects to enhance your story" 
                            : "Upgrade to Pro or Premium plan to use sound effects"}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canUseSoundEffects}
                          aria-readonly={!canUseSoundEffects}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Character Selection */}
                {userCharacters.length > 0 && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-heading font-semibold text-lg">Include Characters</h3>
                      <Link href="/characters">
                        <Button type="button" variant="outline" size="sm" className="flex items-center">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Manage Characters
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {userCharacters.map((character: Character) => (
                        <div key={character.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-slate-50">
                          <Checkbox 
                            id={`character-${character.id}`}
                            checked={selectedCharacters.includes(character.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCharacters([...selectedCharacters, character.id]);
                              } else {
                                setSelectedCharacters(selectedCharacters.filter(id => id !== character.id));
                              }
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`character-${character.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {character.name}
                            </label>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {character.personality}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-red-500 text-white font-heading font-bold text-lg py-6 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Story
                        <Wand2 className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="edit" className="p-6">
            {generatedStory && (
              <div className="space-y-6">
                <div>
                  <FormLabel className="block font-heading font-semibold mb-2 text-lg">Story Title:</FormLabel>
                  <Textarea 
                    value={generatedStory.title} 
                    onChange={(e) => setGeneratedStory({...generatedStory, title: e.target.value})}
                    className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <FormLabel className="block font-heading font-semibold mb-2 text-lg">Story Content:</FormLabel>
                  <Textarea 
                    value={generatedStory.content} 
                    onChange={(e) => setGeneratedStory({...generatedStory, content: e.target.value})}
                    className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200"
                    rows={10}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    onClick={() => setActiveTab("prompt")}
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-heading font-bold"
                  >
                    Back to Prompt
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("preview")}
                    className="bg-primary hover:bg-red-500 text-white font-heading font-bold"
                  >
                    Continue to Preview
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="p-0">
            {generatedStory && audioUrl && (
              <>
                <StoryPreview 
                  story={generatedStory} 
                  audioUrl={audioUrl} 
                  onEdit={() => setActiveTab("edit")}
                  soundEffects={soundEffects}
                  characterIds={selectedCharacters}
                />

                {canUseSoundEffects && (
                  <div className="px-6 pb-6">
                    <SoundEffectSelector
                      audioUrl={audioUrl}
                      duration={audioDuration}
                      soundEffects={soundEffects}
                      onChange={handleSoundEffectsChange}
                      suggestions={soundEffectSuggestions}
                    />
                  </div>
                )}

                {!canUseSoundEffects && (
                  <div className="px-6 pb-6 mt-6">
                    <div className="bg-blue-50 rounded-xl p-5 flex items-center gap-4">
                      <div className="text-primary text-3xl">
                        <VolumeX />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg">Sound Effects Available in Pro Plan</h3>
                        <p className="text-gray-600">Upgrade to Pro or Premium plan to enhance your story with sound effects</p>
                      </div>
                      <Button className="ml-auto bg-purple text-white">
                        Upgrade Plan
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>
    </section>
  );
}
