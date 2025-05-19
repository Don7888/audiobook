import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Download, List, Music2, Save, Loader2 } from "lucide-react";
import { Story } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Link } from "wouter";

// Form schema for playlist creation
const playlistSchema = z.object({
  name: z.string().min(2, { message: "Playlist name must be at least 2 characters" }),
  description: z.string().optional(),
  format: z.enum(["mp3", "yoto", "toniebox", "audible"]),
  stories: z.array(z.string()).min(1, { message: "Select at least one story" })
});

type PlaylistFormValues = z.infer<typeof playlistSchema>;

export default function Export() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  
  // Query to fetch user's stories
  const { data: stories = [], isLoading: isLoadingStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: isAuthenticated,
    staleTime: 30000,
  });
  
  // Initialize form
  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: "",
      description: "",
      format: "mp3",
      stories: []
    }
  });
  
  // Handle form submission
  const onSubmit = async (values: PlaylistFormValues) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to export stories",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Prepare stories for export
      const storiesToExport = stories.filter(story => 
        values.stories.includes(story.id.toString())
      );
      
      if (storiesToExport.length === 0) {
        toast({
          title: "No stories selected",
          description: "Please select at least one story to export",
          variant: "destructive"
        });
        setIsExporting(false);
        return;
      }
      
      // Initiate export API call
      const response = await fetch("/api/stories/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playlistName: values.name,
          description: values.description,
          format: values.format,
          storyIds: values.stories.map(id => parseInt(id))
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to export stories");
      }
      
      const data = await response.json();
      
      // Trigger download
      const downloadLink = document.createElement("a");
      downloadLink.href = data.downloadUrl;
      downloadLink.download = data.filename || `${values.name}.${values.format}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Show success message
      toast({
        title: "Export successful",
        description: `Your playlist "${values.name}" has been exported as ${values.format.toUpperCase()}`,
      });
      
      // Reset form
      form.reset();
      setSelectedStories([]);
      
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your stories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle story selection
  const toggleStorySelection = (storyId: string) => {
    setSelectedStories(prev => {
      if (prev.includes(storyId)) {
        return prev.filter(id => id !== storyId);
      } else {
        return [...prev, storyId];
      }
    });
  };
  
  // Update form when selection changes
  useEffect(() => {
    form.setValue("stories", selectedStories);
  }, [selectedStories, form]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be signed in to export stories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Export Stories | StoryTunes</title>
        <meta name="description" content="Export your stories in various formats for different platforms." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Export Stories</h1>
        <p className="text-gray-600">
          Create playlists and export your stories in various formats.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create a Playlist</CardTitle>
              <CardDescription>
                Select multiple stories and export them as a single file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Playlist Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Favorite Stories" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="A collection of bedtime stories" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Export Format</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mp3">MP3 (Standard Audio)</SelectItem>
                            <SelectItem value="yoto">Yoto Format</SelectItem>
                            <SelectItem value="toniebox">Toniebox Format</SelectItem>
                            <SelectItem value="audible">Audible Format</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the format that matches your playback device.
                        </FormDescription>
                        
                        {field.value === "yoto" && (
                          <div className="mt-3 p-3 border border-purple-200 rounded-md bg-purple-50">
                            <div className="flex items-start">
                              <div className="shrink-0 mr-3">
                                <div className="w-12 h-12 bg-purple-200 rounded-md flex items-center justify-center">
                                  <img 
                                    src="https://cdn-icons-png.flaticon.com/512/9492/9492239.png" 
                                    alt="Yoto" 
                                    className="w-8 h-8"
                                  />
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-purple-800">Yoto Export Includes</h4>
                                <ul className="text-xs text-purple-700 mt-1 list-disc pl-4">
                                  <li>Audio file with all selected stories</li>
                                  <li>Custom cover image generated for your Yoto card</li>
                                  <li>Metadata file with chapter markers</li>
                                  <li>Installation instructions for Yoto app</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel className="block mb-2">Selected Stories ({selectedStories.length})</FormLabel>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedStories.length > 0 ? (
                        selectedStories.map(storyId => {
                          const story = stories.find(s => s.id.toString() === storyId);
                          return story ? (
                            <Badge key={storyId} variant="outline" className="py-1 px-3 cursor-pointer hover:bg-rose-50" onClick={() => toggleStorySelection(storyId)}>
                              {story.title} <span className="ml-1">×</span>
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <p className="text-gray-500 text-sm">No stories selected. Select stories from the list below.</p>
                      )}
                    </div>
                    
                    {form.formState.errors.stories && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.stories.message}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isExporting || selectedStories.length === 0}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export Playlist
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <List className="mr-2 h-5 w-5" />
                Your Stories
              </CardTitle>
              <CardDescription>
                Select stories to include in your playlist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStories ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : stories.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {stories.map(story => (
                    <div
                      key={story.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedStories.includes(story.id.toString())
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                      onClick={() => toggleStorySelection(story.id.toString())}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedStories.includes(story.id.toString())}
                          onCheckedChange={() => toggleStorySelection(story.id.toString())}
                          className="mt-1"
                        />
                        <div>
                          <h3 className="font-medium">{story.title}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                            {story.text.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-lg mb-2">No Stories Yet</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any stories yet.
                  </p>
                  <Button asChild>
                    <Link href="/">Create Your First Story</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">About Export Formats</h2>
        
        <Tabs defaultValue="mp3" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="mp3">MP3</TabsTrigger>
            <TabsTrigger value="yoto">Yoto</TabsTrigger>
            <TabsTrigger value="toniebox">Toniebox</TabsTrigger>
            <TabsTrigger value="audible">Audible</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mp3" className="bg-white p-4 rounded-md border">
            <h3 className="font-medium text-lg mb-2">MP3 Format</h3>
            <p className="text-gray-700">
              The standard audio format that works on virtually all devices. Your stories will be exported as a single MP3 file containing all selected stories in the order you've selected them. Sound effects will be included.
            </p>
          </TabsContent>
          
          <TabsContent value="yoto" className="bg-white p-4 rounded-md border">
            <h3 className="font-medium text-lg mb-2">Yoto Format</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-2/3">
                <p className="text-gray-700 mb-3">
                  Optimized for Yoto players, this format includes chapter markers for each story and is compatible with Yoto Cards. The audio file will be formatted according to Yoto's specifications with appropriate metadata.
                </p>
                <div className="text-sm border-l-4 border-purple-400 pl-3 py-1 bg-purple-50">
                  <p className="font-medium text-purple-800">New Feature: Custom Cover Images</p>
                  <p className="text-gray-700 mt-1">
                    When you export to Yoto format, we'll automatically generate a custom cover image for your playlist that displays on your Yoto player when the card is inserted. The image is specially designed to match your stories' themes.
                  </p>
                </div>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 rounded-xl shadow-md overflow-hidden">
                    <img 
                      src="https://cdn.shopify.com/s/files/1/0588/0042/1610/files/3V2A3098_1_2048x.jpg?v=1651246987" 
                      alt="Yoto Player" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white rounded-xl shadow-md border-4 border-white overflow-hidden">
                    <img 
                      src="https://storage.googleapis.com/pai-images/4ac80495feec42a7ae4eda11af6c1732.jpeg" 
                      alt="Custom Story Image" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="toniebox" className="bg-white p-4 rounded-md border">
            <h3 className="font-medium text-lg mb-2">Toniebox Format</h3>
            <p className="text-gray-700">
              Formatted specifically for Toniebox audio players. This format includes the necessary metadata for Creative-Tonies and will work with your Toniebox player once transferred to your Tonie.
            </p>
          </TabsContent>
          
          <TabsContent value="audible" className="bg-white p-4 rounded-md border">
            <h3 className="font-medium text-lg mb-2">Audible Format</h3>
            <p className="text-gray-700">
              Created to be compatible with Audible's AAX format, this export includes chapter markers, cover art (generated from the story content), and proper metadata for easy listening on Audible-compatible devices.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}