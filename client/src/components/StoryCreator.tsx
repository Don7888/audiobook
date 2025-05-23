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
import { generateStory, generateAudio, generateStoriesBatch, generateAudioBatch, GeneratedStory } from "@/lib/openai";
import StoryPreview from "./StoryPreview";
import SoundEffectSelector from "./SoundEffectSelector";
import AudioPlayer from "./AudioPlayer";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { useParallelProcessing } from "@/hooks/useParallelProcessing";

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
  const { progress, generateBatchStories } = useParallelProcessing();

  // Fetch subscription plans to check features
  const { data: subscriptionPlans } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json();
    }
  });

  // Fetch user characters
  const { data: userCharacters = [] } = useQuery({
    queryKey: ['/api/characters'],
    queryFn: async () => {
      const response = await fetch('/api/characters');
      if (!response.ok) throw new Error('Failed to fetch characters');
      return response.json();
    },
    enabled: isAuthenticated
  });

  const form = useForm<StoryGeneration>({
    resolver: zodResolver(storyGenerationSchema),
    defaultValues: {
      prompt: "",
      batchMode: false,
      batchCount: 3,
      ageRange: "3-5",
      storyLength: "short",
      storyType: "adventure",
      narrator: "Female-Gentle",
      includeSoundEffects: false,
      batchPrompts: Array.from({ length: 3 }, () => ({ prompt: "" }))
    },
  });

  const { fields: batchPrompts, append: appendBatchPrompt, remove: removeBatchPrompt } = useFieldArray({
    control: form.control,
    name: "batchPrompts"
  });

  // Watch for changes in batch count to adjust prompt fields
  useEffect(() => {
    const currentCount = form.watch("batchCount");
    const currentPrompts = batchPrompts;

    if (currentPrompts.length < currentCount) {
      // Add more prompts
      const toAdd = currentCount - currentPrompts.length;
      for (let i = 0; i < toAdd; i++) {
        appendBatchPrompt({ prompt: "" });
      }
    } else if (currentPrompts.length > currentCount) {
      // Remove excess prompts
      const toRemove = currentPrompts.length - currentCount;
      for (let i = 0; i < toRemove; i++) {
        removeBatchPrompt(currentPrompts.length - 1 - i);
      }
    }
  }, [form.watch("batchCount"), appendBatchPrompt, removeBatchPrompt]);

  // Batch generation handler - uses the optimized parallel processing for speed
  const handleGenerateBatch = async () => {
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

      // Get prompts from the form
      const batchPrompts = form.getValues("batchPrompts") || [];
      setBatchProgress(0);

      // Filter out empty prompts
      const validPrompts = batchPrompts.filter(item => item?.prompt?.trim().length >= 10);

      if (validPrompts.length === 0) {
        toast({
          title: "Empty Prompts",
          description: "Please enter at least one valid story prompt with 10+ characters.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }

      // Get form data
      const formData = form.getValues();

      // Find character details for selected characters to include in prompt
      let characterDetails = "";
      if (selectedCharacters.length > 0) {
        characterDetails = selectedCharacters.map(id => {
          const character = userCharacters.find((c: Character) => c.id === id);
          return character ? `Character ${character.name}: ${character.appearance}. Personality: ${character.personality}` : '';
        }).filter(Boolean).join('\n\n');
      }

      // Show starting toast
      toast({
        title: "Starting Batch Generation",
        description: `Generating ${validPrompts.length} stories with parallel processing.`,
      });

      // Create a list of story parameters from all valid prompts
      const storyParamsList = validPrompts.map(item => {
        // Create a complete prompt including characters if available
        let fullPrompt = item.prompt;
        if (characterDetails) {
          fullPrompt = `${fullPrompt}\n\nPlease include the following characters in the story:\n${characterDetails}`;
        }

        return {
          ...formData,
          prompt: fullPrompt,
          userId,
          characterIds: selectedCharacters.length > 0 ? selectedCharacters : undefined
        };
      });

      // Use our batch processing function to generate stories (2 at a time for optimal speed)
      const generatedStories = await generateStoriesBatch(storyParamsList, 2);

      // Update progress bar
      setBatchProgress(validPrompts.length);

      toast({
        title: "Stories Generated",
        description: `Created ${generatedStories.length} stories. Now generating audio...`,
      });

      // Prepare parameters for audio generation
      const audioParams = generatedStories.map(story => ({
        text: story.content,
        voice: formData.narrator,
        userId: userId,
        title: story.title
      }));

      // Generate all audio files in parallel
      const audioUrls = await generateAudioBatch(audioParams, 2);

      // Save each story one by one (could be parallelized in the future)
      const storyIds: number[] = [];
      for (let i = 0; i < generatedStories.length; i++) {
        try {
          const saveResponse = await fetch('/api/stories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: generatedStories[i].title,
              text: generatedStories[i].content,
              prompt: validPrompts[i].prompt,
              ageRange: formData.ageRange,
              storyLength: formData.storyLength,
              storyType: formData.storyType,
              narrator: formData.narrator,
              audioUrl: audioUrls[i],
              userId: userId,
              characterIds: selectedCharacters
            }),
          });

          if (saveResponse.ok) {
            const savedStory = await saveResponse.json();
            storyIds.push(savedStory.id);
          } else {
            console.error(`Failed to save batch story ${i+1}:`, await saveResponse.text());
            storyIds.push(-1);
          }
        } catch (error) {
          console.error(`Error saving batch story ${i+1}:`, error);
          storyIds.push(-1);
        }
      }

      // Store the batch results for display
      setBatchStories(generatedStories);
      setBatchAudios(audioUrls);
      setBatchStoriesIds(storyIds);

      // Show success message
      toast({
        title: "Batch Generation Complete!",
        description: `Successfully created ${generatedStories.length} stories. View results in the Batch Results tab.`,
      });

      // Switch to the batch results tab
      setActiveTab("batch-results");
    } catch (error) {
      console.error("Error in batch generation:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate batch stories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Single story generation handler
  const handleSingleStoryGeneration = async (data: StoryGeneration) => {
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

      // Find character details for selected characters to include in prompt
      let characterDetails = "";
      if (selectedCharacters.length > 0) {
        characterDetails = selectedCharacters.map(id => {
          const character = userCharacters.find((c: Character) => c.id === id);
          return character ? `Character ${character.name}: ${character.appearance}. Personality: ${character.personality}` : '';
        }).filter(Boolean).join('\n\n');
      }

      // Create a complete prompt including characters if available
      let fullPrompt = data.prompt;
      if (characterDetails) {
        fullPrompt = `${data.prompt}\n\nPlease include the following characters in the story:\n${characterDetails}`;
      }

      // Generate the story (include character IDs for saving)
      const storyResponse = await generateStory({ ...data, prompt: fullPrompt });
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
    } catch (error) {
      console.error("Error generating single story:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate the story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit handler for the form
  const handleFormSubmit = async (data: StoryGeneration) => {
    console.log("Form submitted with data:", data);
    console.log("Active tab:", activeTab);
    
    // For single story generation
    if (activeTab === "prompt") {
      console.log("Starting single story generation");
      await handleSingleStoryGeneration(data);
    } 
    // For batch story generation
    else if (activeTab === "batch") {
      console.log("Starting batch generation");
      await handleGenerateBatch();
    }
  };

  const handleSoundEffectsChange = (newEffects: SoundEffectPlacement[]) => {
    setSoundEffects(newEffects);
  };

  // Reset sound effects when story changes
  useEffect(() => {
    setSoundEffects([]);
  }, [generatedStory]);

  // Check if user has premium features for batch generation
  const userHasPremium = user?.subscriptionTier === 'premium';

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Create Amazing Stories</h3>
          <p className="text-gray-600">
            Sign in to start creating personalized children's audiobooks with AI-powered storytelling.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/signin">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          AI Story Creator
        </h1>
        <p className="text-gray-600">
          Create magical children's stories with AI-powered narration and sound effects
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="prompt">Story Prompt</TabsTrigger>
              <TabsTrigger value="batch" disabled={!userHasPremium}>
                Batch Creation {!userHasPremium && "(Premium)"}
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={!generatedStory && batchStories.length === 0}>
                Preview
              </TabsTrigger>
              <TabsTrigger value="batch-results" disabled={batchStories.length === 0}>
                Batch Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="space-y-6">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Story Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell me a story about a brave little mouse who discovers a magical garden..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Character Selection */}
              {userCharacters.length > 0 && (
                <div className="space-y-3">
                  <FormLabel className="text-lg font-semibold">Include Characters</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {userCharacters.map((character: Character) => (
                      <div key={character.id} className="flex items-center space-x-3 p-3 border rounded-lg">
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
                        <div className="flex-1">
                          <label htmlFor={`character-${character.id}`} className="font-medium cursor-pointer">
                            {character.name}
                          </label>
                          <p className="text-sm text-gray-600">{character.appearance}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Range</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select age range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="6-8">6-8 years</SelectItem>
                          <SelectItem value="9-12">9-12 years</SelectItem>
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
                      <FormLabel>Story Length</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="short">Short (2-3 min)</SelectItem>
                          <SelectItem value="medium">Medium (5-7 min)</SelectItem>
                          <SelectItem value="long">Long (10+ min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Story Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                          <SelectItem value="bedtime">Bedtime</SelectItem>
                          <SelectItem value="fantasy">Fantasy</SelectItem>
                          <SelectItem value="friendship">Friendship</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="narrator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narrator Voice</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select narrator voice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Female-Gentle">Female - Gentle</SelectItem>
                        <SelectItem value="Male-Cheerful">Male - Cheerful</SelectItem>
                        <SelectItem value="Female-Animated">Female - Animated</SelectItem>
                        <SelectItem value="Male-Storyteller">Male - Storyteller</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                size="lg" 
                disabled={isGenerating || !form.watch("prompt")?.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Button clicked!");
                  const formData = form.getValues();
                  // For single story generation, we only need the main story data, not batch prompts
                  const singleStoryData = {
                    prompt: formData.prompt,
                    ageRange: formData.ageRange,
                    storyLength: formData.storyLength,
                    storyType: formData.storyType,
                    narrator: formData.narrator,
                    batchMode: false,
                    batchCount: 1,
                    includeSoundEffects: formData.includeSoundEffects,
                    batchPrompts: [{ prompt: formData.prompt }] // Only include the main prompt
                  };
                  console.log("Starting story generation with:", singleStoryData);
                  handleFormSubmit(singleStoryData);
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Your Story...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Story
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="batch" className="space-y-6">
              {!userHasPremium ? (
                <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Feature</h3>
                  <p className="text-gray-600 mb-4">
                    Batch story creation is available for Premium subscribers. Generate up to 10 stories at once!
                  </p>
                  <Link href="/subscription">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      Upgrade to Premium
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="batchCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Number of Stories</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 8 }, (_, i) => i + 3).map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} stories
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Character Selection for Batch */}
                    {userCharacters.length > 0 && (
                      <div className="space-y-3">
                        <FormLabel className="text-lg font-semibold">Include Characters</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {userCharacters.map((character: Character) => (
                            <div key={character.id} className="flex items-center space-x-3 p-3 border rounded-lg">
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
                              <div className="flex-1">
                                <label htmlFor={`batch-character-${character.id}`} className="font-medium cursor-pointer">
                                  {character.name}
                                </label>
                                <p className="text-sm text-gray-600">{character.appearance}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <FormLabel className="text-lg font-semibold">Story Prompts</FormLabel>
                      {batchPrompts.map((prompt, index) => (
                        <FormField
                          key={prompt.id}
                          control={form.control}
                          name={`batchPrompts.${index}.prompt`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Story {index + 1}</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={`Enter prompt for story ${index + 1}...`}
                                  className="min-h-[80px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="ageRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Range</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select age range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="3-5">3-5 years</SelectItem>
                                <SelectItem value="6-8">6-8 years</SelectItem>
                                <SelectItem value="9-12">9-12 years</SelectItem>
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
                            <FormLabel>Story Length</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select length" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="short">Short (2-3 min)</SelectItem>
                                <SelectItem value="medium">Medium (5-7 min)</SelectItem>
                                <SelectItem value="long">Long (10+ min)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="storyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Story Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="adventure">Adventure</SelectItem>
                                <SelectItem value="educational">Educational</SelectItem>
                                <SelectItem value="bedtime">Bedtime</SelectItem>
                                <SelectItem value="fantasy">Fantasy</SelectItem>
                                <SelectItem value="friendship">Friendship</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="narrator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Narrator Voice</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select narrator voice" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Female-Gentle">Female - Gentle</SelectItem>
                              <SelectItem value="Male-Cheerful">Male - Cheerful</SelectItem>
                              <SelectItem value="Female-Animated">Female - Animated</SelectItem>
                              <SelectItem value="Male-Storyteller">Male - Storyteller</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {isGenerating && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Generating stories...</span>
                          <span>{batchProgress} stories completed</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(batchProgress / form.watch("batchCount")) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      size="lg" 
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating {form.watch("batchCount")} Stories...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate {form.watch("batchCount")} Stories
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              {generatedStory ? (
                <div className="space-y-6">
                  <StoryPreview
                    story={generatedStory}
                    audioUrl={audioUrl || ""}
                    soundEffects={soundEffects}
                    characterIds={selectedCharacters}
                  />

                  <Tabs defaultValue="audio" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="audio">
                        <Headphones className="mr-2 h-4 w-4" />
                        Audio & Effects
                      </TabsTrigger>
                      <TabsTrigger value="text">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Text View
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="audio" className="space-y-4">
                      {audioUrl && (
                        <div className="space-y-4">
                          <AudioPlayer
                            audioUrl={audioUrl}
                            className="w-full"
                            storyText={generatedStory.content}
                          />

                          <SoundEffectSelector
                            audioUrl={audioUrl || ""}
                            duration={audioDuration}
                            soundEffects={soundEffects}
                            onChange={handleSoundEffectsChange}
                            suggestions={soundEffectSuggestions}
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                      <div className="prose max-w-none p-6 bg-white border rounded-lg">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{generatedStory.title}</h2>
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {generatedStory.content}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Generate a story to see the preview here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="batch-results" className="space-y-6">
              {batchStories.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch Generation Results</h2>
                    <p className="text-gray-600">Successfully generated {batchStories.length} stories</p>
                  </div>

                  <div className="grid gap-6">
                    {batchStories.map((story, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-gray-900">{story.title}</h3>
                          <div className="flex gap-2">
                            {batchStoriesIds[index] > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Handle save logic here
                                  toast({
                                    title: "Story Saved",
                                    description: "Story has been saved to your library.",
                                  });
                                }}
                              >
                                Save
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Handle delete logic here
                                const newStories = batchStories.filter((_, i) => i !== index);
                                const newAudios = batchAudios.filter((_, i) => i !== index);
                                const newIds = batchStoriesIds.filter((_, i) => i !== index);
                                setBatchStories(newStories);
                                setBatchAudios(newAudios);
                                setBatchStoriesIds(newIds);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        
                        {batchAudios[index] && (
                          <div className="mb-4">
                            <AudioPlayer
                              audioUrl={batchAudios[index]}
                              className="w-full"
                              storyText={story.content}
                            />
                          </div>
                        )}
                        
                        <div className="prose max-w-none">
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6">
                            {story.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No batch stories generated yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}