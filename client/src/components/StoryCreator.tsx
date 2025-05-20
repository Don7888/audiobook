import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStories, setBatchStories] = useState<GeneratedStory[]>([]);
  const [batchAudios, setBatchAudios] = useState<string[]>([]);
  const [batchStoriesIds, setBatchStoriesIds] = useState<number[]>([]);
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
  
  // Force-enable sound effects for debugging
  const canUseSoundEffects = true; // temporarily enable for all users to debug

  const form = useForm<StoryGeneration>({
    resolver: zodResolver(storyGenerationSchema),
    defaultValues: {
      prompt: "",
      ageRange: "3-5 years",
      storyLength: "Short (2-3 min)",
      storyType: "Adventure",
      narrator: "Female - Gentle",
      includeSoundEffects: false,
      batchMode: false,
      batchCount: 3,
      batchPrompts: [
        { prompt: "" },
        { prompt: "" },
        { prompt: "" }
      ]
    }
  });
  
  const { fields: batchPromptFields, append: appendBatchPrompt, remove: removeBatchPrompt } = useFieldArray({
    control: form.control,
    name: "batchPrompts"
  });
  
  // Manage batch prompts count 
  useEffect(() => {
    const currentCount = form.getValues("batchCount") || 3;
    const currentPrompts = form.getValues("batchPrompts") || [];
    
    // Add empty prompts if we need more
    if (currentPrompts.length < currentCount) {
      const toAdd = currentCount - currentPrompts.length;
      for (let i = 0; i < toAdd; i++) {
        appendBatchPrompt({ prompt: "" });
      }
    }
    
    // Remove excess prompts if we have too many
    if (currentPrompts.length > currentCount) {
      const toRemove = currentPrompts.length - currentCount;
      for (let i = 0; i < toRemove; i++) {
        removeBatchPrompt(currentPrompts.length - 1 - i);
      }
    }
  }, [form.watch("batchCount"), appendBatchPrompt, removeBatchPrompt]);

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
      let characterDetails = "";
      if (selectedCharacters.length > 0) {
        characterDetails = selectedCharacters.map(id => {
          const character = userCharacters.find((c: Character) => c.id === id);
          return character ? `Character ${character.name}: ${character.appearance}. Personality: ${character.personality}` : '';
        }).filter(Boolean).join('\n\n');
      }
      
      // Check if we're in batch mode (active tab is "batch")
      if (activeTab === "batch") {
        // For Premium users: Generate multiple stories with different prompts
        const batchPrompts = data.batchPrompts || [];
        const batchResults: GeneratedStory[] = [];
        setBatchProgress(0);
        
        // Filter out empty prompts
        const validPrompts = batchPrompts.filter(item => item.prompt.trim().length >= 10);
        
        if (validPrompts.length === 0) {
          toast({
            title: "Empty Prompts",
            description: "Please enter at least one valid story prompt with 10+ characters.",
            variant: "destructive"
          });
          setIsGenerating(false);
          return;
        }
        
        for (let i = 0; i < validPrompts.length; i++) {
          // Create copy of storyParams with this specific prompt
          const promptParams = {
            ...storyParams,
            prompt: validPrompts[i].prompt
          };
          
          // Append character information to this prompt if available
          if (characterDetails) {
            promptParams.prompt = `${promptParams.prompt}\n\nPlease include the following characters in the story:\n${characterDetails}`;
          }
          
          // Generate story for this prompt
          const storyResponse = await generateStory(promptParams);
          
          // Generate audio for the story
          const audioUrl = await generateAudio(storyResponse.content, data.narrator, userId, storyResponse.title);
          
          // Save each story to the library automatically
          try {
            const response = await fetch('/api/stories', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: storyResponse.title,
                text: storyResponse.content,
                prompt: validPrompts[i].prompt,
                ageRange: data.ageRange,
                storyLength: data.storyLength,
                storyType: data.storyType,
                narrator: data.narrator,
                audioUrl: audioUrl,
                userId: userId,
                characterIds: selectedCharacters
              }),
            });
            
            if (!response.ok) {
              console.error(`Failed to save batch story ${i+1}:`, await response.text());
            }
          } catch (error) {
            console.error(`Error saving batch story ${i+1}:`, error);
          }
          
          batchResults.push(storyResponse);
          setBatchProgress(i + 1);
        }
        
        // Generate audio for all stories in the batch
        if (batchResults.length > 0) {
          const audioUrls: string[] = [];
          const storyIds: number[] = [];
          
          // First generate all audio files
          for (let i = 0; i < batchResults.length; i++) {
            try {
              const audioUrl = await generateAudio(batchResults[i].content, data.narrator, userId, batchResults[i].title);
              audioUrls.push(audioUrl);
              
              // Try to save the story to get an ID
              const response = await fetch('/api/stories', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: batchResults[i].title,
                  text: batchResults[i].content,
                  prompt: validPrompts[i].prompt,
                  ageRange: data.ageRange,
                  storyLength: data.storyLength,
                  storyType: data.storyType,
                  narrator: data.narrator,
                  audioUrl: audioUrl,
                  userId: userId,
                  characterIds: selectedCharacters
                }),
              });
              
              if (response.ok) {
                const savedStory = await response.json();
                storyIds.push(savedStory.id);
              } else {
                console.error(`Failed to save batch story ${i+1}:`, await response.text());
                storyIds.push(-1);
              }
            } catch (error) {
              console.error(`Error generating audio for batch story ${i+1}:`, error);
              audioUrls.push('');
              storyIds.push(-1);
            }
            
            // Update progress for each story generated
            setBatchProgress(i + 1);
          }
          
          // Store the batch results
          setGeneratedStory(batchResults[0]);  // First story for main preview
          setBatchStories(batchResults);       // All generated stories
          setBatchAudios(audioUrls);           // Audio URLs for each story
          setBatchStoriesIds(storyIds);        // Database IDs for saved stories
          
          // Set the first audio for the main player
          if (audioUrls.length > 0 && audioUrls[0]) {
            setAudioUrl(audioUrls[0]);
            
            // Estimate audio duration for the first story
            const estimatedDuration = batchResults[0].content.length * 0.1;
            setAudioDuration(estimatedDuration);
            
            // Reset sound effects
            setSoundEffects([]);
            
            // Store sound effect suggestions if available
            if (batchResults[0].soundEffectSuggestions) {
              setSoundEffectSuggestions(batchResults[0].soundEffectSuggestions);
            }
          }
          
          // Create a dedicated tab for batch results
          setActiveTab("batch-results");
        }
        
        toast({
          title: "Batch Generation Complete!",
          description: `Successfully created ${batchResults.length} stories. All have been saved to your library.`,
        });
      } else {
        // Standard single story generation from the prompt tab
        
        // Append character information to the prompt if available
        if (characterDetails) {
          storyParams.prompt = `${storyParams.prompt}\n\nPlease include the following characters in the story:\n${characterDetails}`;
        }
        
        // Generate the story text
        const storyResponse = await generateStory(storyParams);
        setGeneratedStory(storyResponse);
        
        // Store sound effect suggestions if available
        if (storyResponse.soundEffectSuggestions) {
          setSoundEffectSuggestions(storyResponse.soundEffectSuggestions);
        }
        
        // Generate audio for the story (include title so narrator reads it first)
        const audioUrl = await generateAudio(storyResponse.content, data.narrator, userId, storyResponse.title);
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
      }
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
            {(userData?.subscriptionTier === "premium" || true) && ( /* forcing visibility for testing */
              <TabsTrigger 
                value="batch" 
                className="flex-1 py-4 font-heading font-semibold text-lg data-[state=active]:text-primary data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 7h12v7H8z"></path>
                  <path d="M4 11h12v7H4z"></path>
                  <path d="M16 15h4v5h-4z"></path>
                </svg> Batch Create
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="preview" 
              className="flex-1 py-4 font-heading font-semibold text-lg data-[state=active]:text-primary data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none"
              disabled={!generatedStory}
            >
              <Headphones className="mr-2" /> Audio & Effects
            </TabsTrigger>
            {batchStories.length > 0 && (
              <TabsTrigger 
                value="batch-results" 
                className="flex-1 py-4 font-heading font-semibold text-lg data-[state=active]:text-primary data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </svg> Batch Results ({batchStories.length})
              </TabsTrigger>
            )}
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
                
                {/* Batch Generation for Premium Users */}
                {userData?.subscriptionTier === "premium" && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">Premium Feature: Batch Story Generation</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      As a premium user, you can generate multiple stories at once with the same prompt.
                    </p>
                    
                    <div className="flex items-center mb-4">
                      <Switch 
                        checked={batchMode} 
                        onCheckedChange={(checked) => setBatchMode(checked)}
                        id="batch-mode"
                        className="data-[state=checked]:bg-purple-600"
                      />
                      <label htmlFor="batch-mode" className="ml-2 text-sm font-medium">
                        Enable Batch Story Generation
                      </label>
                    </div>
                    
                    {batchMode && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium mb-1">Number of Stories to Generate (1-10):</label>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                            className="h-8 w-8 p-0"
                          >-</Button>
                          <div className="mx-2 px-3 py-1 bg-white rounded-md border text-center min-w-[40px]">
                            {batchCount}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setBatchCount(Math.min(10, batchCount + 1))}
                            className="h-8 w-8 p-0"
                          >+</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Batch story generation has been moved to its own tab */}
                
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
          
          <TabsContent value="batch" className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateStory)} className="space-y-6">
                <div className="mb-4">
                  <h3 className="font-heading font-bold text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    Batch Story Creation
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create up to 10 different stories at once. Each story will have a different prompt but share the same settings.
                  </p>
                  
                  {/* Common settings section */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                    <h4 className="font-medium text-lg mb-4">Common Settings for All Stories</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <FormField
                        control={form.control}
                        name="ageRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">Age Range:</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full rounded-lg border">
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
                            <FormLabel className="font-medium">Story Length:</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full rounded-lg border">
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
                      
                      <FormField
                        control={form.control}
                        name="narrator"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">Narrator Voice:</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full rounded-lg border">
                                  <SelectValue placeholder="Select narrator" />
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
                      name="storyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Story Type:</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full rounded-lg border">
                                <SelectValue placeholder="Select story type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Adventure">Adventure</SelectItem>
                              <SelectItem value="Fantasy">Fantasy</SelectItem>
                              <SelectItem value="Educational">Educational</SelectItem>
                              <SelectItem value="Bedtime">Bedtime</SelectItem>
                              <SelectItem value="Moral Lesson">Moral Lesson</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    {canUseSoundEffects && (
                      <FormField
                        control={form.control}
                        name="includeSoundEffects"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 mt-4">
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-medium">
                              Include Sound Effects in all stories
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
                
                {/* Batch count control */}
                <div className="mb-6">
                  <FormField
                    control={form.control}
                    name="batchCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold mb-2">Number of Stories to Generate:</FormLabel>
                        <div className="flex items-center mb-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => field.onChange(Math.max(1, field.value - 1))}
                            className="h-9 w-9 p-0 rounded-md"
                          >-</Button>
                          <FormControl>
                            <div className="mx-4 px-4 py-2 bg-white rounded-md border border-gray-300 text-center font-medium text-lg min-w-[50px]">
                              {field.value}
                            </div>
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => field.onChange(Math.min(10, field.value + 1))}
                            className="h-9 w-9 p-0 rounded-md"
                          >+</Button>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Story prompts section */}
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-heading font-semibold text-lg sticky top-0 bg-white py-2">Story Prompts</h4>
                  
                  {batchPromptFields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-white rounded-xl border-2 border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">Story #{index + 1}</h5>
                      </div>
                      <FormField
                        control={form.control}
                        name={`batchPrompts.${index}.prompt`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Story Idea:</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                className="w-full rounded-lg border-2 border-gray-200 p-3"
                                placeholder="Describe your story idea here..."
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Characters section */}
                {userCharacters.length > 0 && (
                  <div className="space-y-4 border rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-heading font-semibold text-lg">Include Characters in All Stories</h3>
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
                            id={`batch-character-${character.id}`}
                            checked={selectedCharacters.includes(character.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCharacters([...selectedCharacters, character.id]);
                              } else {
                                setSelectedCharacters(selectedCharacters.filter(id => id !== character.id));
                              }
                            }}
                          />
                          <div>
                            <label
                              htmlFor={`batch-character-${character.id}`}
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
                    type="button" 
                    className="bg-primary hover:bg-red-500 text-white font-heading font-bold text-lg py-6 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                    disabled={isGenerating}
                    onClick={async () => {
                      // Check if there's at least one valid prompt
                      const batchPrompts = form.getValues("batchPrompts") || [];
                      const validPrompts = batchPrompts.filter(item => item?.prompt?.trim().length >= 10);
                      
                      if (validPrompts.length === 0) {
                        toast({
                          title: "Empty Prompts",
                          description: "Please enter at least one valid story prompt with 10+ characters.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      try {
                        // Set actively generating state
                        setIsGenerating(true);
                        toast({
                          title: "Starting Batch Generation",
                          description: `Generating ${validPrompts.length} stories. This may take a few minutes.`,
                        });
                        
                        // Use handleGenerateStory directly with form data
                        const formData = form.getValues();
                        formData.batchMode = true; // Ensure batch mode is enabled
                        
                        // Get all form values to pass to the story generation handler
                        await handleGenerateStory(formData);
                      } catch (error) {
                        console.error("Error in batch generation:", error);
                        toast({
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to generate batch stories. Please try again.",
                          variant: "destructive"
                        });
                        setIsGenerating(false);
                      }
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {batchProgress > 0 ? `Generating ${batchProgress} of ${form.getValues("batchCount")}...` : "Generating..."}
                      </>
                    ) : (
                      <>
                        Generate Batch 
                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 7h12v7H8z"></path>
                          <path d="M4 11h12v7H4z"></path>
                          <path d="M16 15h4v5h-4z"></path>
                        </svg>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="batch-results" className="p-6">
            <div className="space-y-8">
              <div className="mb-4">
                <h3 className="font-heading font-bold text-xl mb-2">Batch Generation Results</h3>
                <p className="text-gray-600 mb-4">
                  Here are all the stories generated in this batch. You can listen to each one and save or delete them.
                </p>
              </div>
              
              {batchStories.length > 0 ? (
                batchStories.map((story, index) => {
                  const audioUrl = batchAudios[index] || '';
                  const storyId = batchStoriesIds[index] || -1;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                      <div className="bg-gray-50 p-4 border-b">
                        <h4 className="font-heading font-semibold text-lg">{story.title}</h4>
                      </div>
                      
                      {/* Audio player for this story */}
                      <div className="p-4 border-b bg-white">
                        {audioUrl ? (
                          <div className="flex items-center justify-between">
                            <audio 
                              controls 
                              src={audioUrl}
                              className="w-full max-w-md"
                              controlsList="nodownload"
                            />
                            
                            <div className="flex space-x-2">
                              {storyId > 0 ? (
                                <Button 
                                  type="button" 
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/stories/${storyId}`, {
                                        method: 'DELETE'
                                      });
                                      
                                      if (response.ok) {
                                        // Update the local state to remove this story
                                        const newBatchStories = [...batchStories];
                                        const newBatchAudios = [...batchAudios];
                                        const newBatchIds = [...batchStoriesIds];
                                        
                                        newBatchStories.splice(index, 1);
                                        newBatchAudios.splice(index, 1);
                                        newBatchIds.splice(index, 1);
                                        
                                        setBatchStories(newBatchStories);
                                        setBatchAudios(newBatchAudios);
                                        setBatchStoriesIds(newBatchIds);
                                        
                                        toast({
                                          title: "Story Deleted",
                                          description: "Story has been removed from your library",
                                        });
                                      } else {
                                        toast({
                                          title: "Error",
                                          description: "Failed to delete the story. Please try again.",
                                          variant: "destructive"
                                        });
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "An error occurred while deleting the story.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              ) : (
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      // Save the story to the database
                                      const response = await fetch('/api/stories', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          title: story.title,
                                          text: story.content,
                                          prompt: form.getValues("batchPrompts")[index]?.prompt || "",
                                          ageRange: form.getValues("ageRange"),
                                          storyLength: form.getValues("storyLength"),
                                          storyType: form.getValues("storyType"),
                                          narrator: form.getValues("narrator"),
                                          audioUrl: audioUrl,
                                          userId: userId,
                                          characterIds: selectedCharacters
                                        }),
                                      });
                                      
                                      if (response.ok) {
                                        const savedStory = await response.json();
                                        
                                        // Update the ID in our state
                                        const newIds = [...batchStoriesIds];
                                        newIds[index] = savedStory.id;
                                        setBatchStoriesIds(newIds);
                                        
                                        toast({
                                          title: "Story Saved",
                                          description: "Story has been saved to your library",
                                        });
                                      } else {
                                        toast({
                                          title: "Error",
                                          description: "Failed to save the story. Please try again.",
                                          variant: "destructive"
                                        });
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "An error occurred while saving the story.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  Save
                                </Button>
                              )}
                              
                              <Button 
                                type="button" 
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Set this story as the current story for editing
                                  setGeneratedStory(story);
                                  setAudioUrl(audioUrl);
                                  setActiveTab("preview");
                                }}
                              >
                                Edit & Add Effects
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            Audio failed to generate for this story.
                          </div>
                        )}
                      </div>
                      
                      {/* Story content summary */}
                      <div className="p-4 bg-white">
                        <div className="max-h-32 overflow-y-auto text-sm text-gray-700">
                          {story.content.substring(0, 300)}
                          {story.content.length > 300 && '...'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No stories have been generated yet. Use the Batch Create tab to generate multiple stories.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="p-0">
            {generatedStory && audioUrl && (
              <>
                <StoryPreview 
                  story={generatedStory} 
                  audioUrl={audioUrl} 
                  soundEffects={soundEffects}
                  characterIds={selectedCharacters}
                />
                
                <div className="p-6 border-t border-gray-200">
                  <h3 className="font-heading font-semibold text-xl mb-4">Edit Story Content</h3>
                  <div className="space-y-4">
                    <div>
                      <FormLabel className="block font-heading font-semibold mb-2">Title:</FormLabel>
                      <Textarea 
                        value={generatedStory.title} 
                        onChange={(e) => setGeneratedStory({...generatedStory, title: e.target.value})}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-primary focus:ring focus:ring-primary/20"
                      />
                    </div>
                    
                    <div>
                      <FormLabel className="block font-heading font-semibold mb-2">Content:</FormLabel>
                      <Textarea 
                        value={generatedStory.content} 
                        onChange={(e) => setGeneratedStory({...generatedStory, content: e.target.value})}
                        className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-primary focus:ring focus:ring-primary/20"
                        rows={8}
                      />
                    </div>
                  </div>
                </div>

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
