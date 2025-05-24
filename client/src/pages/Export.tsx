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
  format: z.enum(["mp3", "yuto", "toniebox", "audible"]),
  stories: z.array(z.string()).min(1, { message: "Select at least one story" })
});

type PlaylistFormValues = z.infer<typeof playlistSchema>;

export default function Export() {
  // Add responsive styles to ensure buttons are visible on mobile
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  
  // Query to fetch user's stories
  const { data: stories = [], isLoading: isLoadingStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    staleTime: 30000,
  });
  
  // Initialize form
  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: "My Story Collection",
      description: "",
      format: "mp3",
      stories: []
    }
  });
  
  // State for download links from export
  const [exportResults, setExportResults] = useState<{
    downloadUrl?: string;
    tracksUrl?: string;
    filename?: string;
  }>({});
  
  // Handle form submission
  const onSubmit = async (values: PlaylistFormValues) => {
    // TEMPORARILY REMOVED AUTHENTICATION CHECK FOR TESTING
    // if (!isAuthenticated) {
    //   toast({
    //     title: "Authentication required",
    //     description: "Please sign in to export stories",
    //     variant: "destructive"
    //   });
    //   return;
    // }
    
    try {
      setIsExporting(true);
      setExportResults({});
      
      // Prepare stories for export
      const storiesToExport = stories.filter(story => 
        selectedStories.includes(story.id.toString())
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
          storyIds: selectedStories.map(id => parseInt(id))
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to export stories");
      }
      
      const data = await response.json();
      
      // If it's a Yuto export, remember both the main download and individual tracks
      if (values.format === "yuto") {
        setExportResults({
          downloadUrl: data.downloadUrl,
          tracksUrl: data.individualTracks || undefined,
          filename: data.filename
        });
        
        toast({
          title: "Yoto Export successful",
          description: "Your stories have been exported in Yoto format with individual tracks and custom cover art",
          duration: 5000,
        });
      } else {
        // For other formats, trigger immediate download
        const downloadLink = document.createElement("a");
        downloadLink.href = data.downloadUrl;
        downloadLink.download = data.filename || `${values.name}.${values.format}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast({
          title: "Export successful",
          description: `Your playlist "${values.name}" has been exported as ${values.format.toUpperCase()}`,
        });
        
        // Reset form for non-Yoto formats
        form.reset();
        setSelectedStories([]);
      }
      
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
  
  // Function to download the exported file
  const downloadExportedFile = (url: string, filename: string) => {
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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
  
  // With our authentication bypass, we always proceed as authenticated
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Export Stories | StoryTunes</title>
        <meta name="description" content="Export your stories in various formats for different platforms." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Export Stories</h1>
        <p className="text-gray-600 mb-4">
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
                            <SelectItem value="yuto">Yuto Format</SelectItem>
                            <SelectItem value="toniebox">Toniebox Format</SelectItem>
                            <SelectItem value="audible">Audible Format</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the format that matches your playback device.
                        </FormDescription>
                        

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
                  
                  {exportResults.downloadUrl && form.watch("format") === "yuto" ? (
                    <div className="space-y-3">
                      <div className="bg-green-50 p-4 rounded-md border border-green-200">
                        <div className="flex items-center text-green-700 mb-2">
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <h3 className="font-medium">Export Complete!</h3>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">
                          Your Yuto package has been created with custom cover art and individual tracks.
                        </p>

                        <div className="flex flex-col space-y-3 mb-4">
                          <Button 
                            onClick={() => downloadExportedFile(exportResults.downloadUrl!, exportResults.filename || "yuto-export.yuto")}
                            className="bg-purple-600 hover:bg-purple-700 w-full py-5 text-base"
                            size="lg"
                          >
                            <Download className="mr-2 h-5 w-5" />
                            Download Audiobook
                          </Button>
                          
                          {exportResults.tracksUrl && (
                            <Button 
                              onClick={() => downloadExportedFile(exportResults.tracksUrl!, "yuto-tracks.zip")}
                              variant="outline"
                              className="border-purple-300 text-purple-700 hover:bg-purple-50 w-full py-5 text-base"
                              size="lg"
                            >
                              <Download className="mr-2 h-5 w-5" />
                              Download Individual Tracks
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-600 bg-white p-2 rounded border mt-2">
                          <p className="font-medium mb-1">What's included in the individual tracks:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Individual MP3 files with ID3 tags</li>
                            <li>Custom 600x600 JPEG cover art for each track</li>
                            <li>Properly numbered tracks for easy upload to Yoto</li>
                            <li>Installation guide for Yoto player</li>
                          </ul>
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setExportResults({});
                              form.reset();
                              setSelectedStories([]);
                            }}
                          >
                            Create New Export
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : form.watch("format") === "yuto" ? (
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-md border border-purple-100">
                        <p className="text-xs text-gray-600 mb-2">When exporting for Yuto format, you'll receive:</p>
                        <div className="grid gap-2">
                          <Button 
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
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
                                Export Complete Package
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-center text-gray-500">The download will include both a complete audiobook and individual tracks</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-700 mb-1">Main Features</p>
                          <ul className="text-xs text-left text-gray-600 space-y-1 pl-5 list-disc">
                            <li>ID3 tagged tracks</li>
                            <li>Individual cover art</li>
                            <li>Yoto-ready format</li>
                          </ul>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-700 mb-1">File Formats</p>
                          <ul className="text-xs text-left text-gray-600 space-y-1 pl-5 list-disc">
                            <li>MP3 audio files</li>
                            <li>600x600 JPEG covers</li>
                            <li>ZIP package</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}
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
      
      <div className="mt-8 mb-8">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Export Your Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Now that you've selected your stories and created your playlist, click the button below to export them as a single file.
            </p>
            <Button 
              type="button"
              className="w-full bg-red-600 hover:bg-red-700 mb-2 py-6 text-lg"
              size="lg"
              onClick={() => {
                form.handleSubmit(onSubmit)();
              }}
              disabled={isExporting || selectedStories.length === 0}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Download className="mr-2 h-5 w-5" />
              )}
              {isExporting ? "Exporting..." : "Export Selected Stories"}
            </Button>
            <p className="text-xs text-center text-gray-500">
              {selectedStories.length > 0 ? 
                `${selectedStories.length} ${selectedStories.length === 1 ? 'story' : 'stories'} selected for export` : 
                'Select at least one story to enable export'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">About Export Formats</h2>
        
        <Tabs defaultValue="mp3" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="mp3">MP3</TabsTrigger>
            <TabsTrigger value="yuto">Yuto</TabsTrigger>
            <TabsTrigger value="toniebox">Toniebox</TabsTrigger>
            <TabsTrigger value="audible">Audible</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mp3" className="bg-white p-4 rounded-md border">
            <h3 className="font-medium text-lg mb-2">MP3 Format</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-2/3">
                <p className="text-gray-700 mb-4">
                  The standard audio format that works on virtually all devices. Your stories will be exported as a single MP3 file containing all selected stories in the order you've selected them. Sound effects will be included.
                </p>
                <Button 
                  type="button"
                  className="w-full bg-purple-600 hover:bg-purple-700 mb-2 py-6 text-lg"
                  size="lg"
                  onClick={() => {
                    form.setValue("format", "mp3");
                    form.handleSubmit(onSubmit)();
                  }}
                  disabled={isExporting || selectedStories.length === 0}
                >
                  {isExporting && form.getValues().format === "mp3" ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-5 w-5" />
                  )}
                  {isExporting && form.getValues().format === "mp3" ? "Exporting..." : "Export to MP3 Format"}
                </Button>
                <p className="text-xs text-gray-500 text-center">Select your stories first, then click to export</p>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center">
                  <Music2 className="h-16 w-16 text-purple-600" />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="yuto" className="bg-white p-4 rounded-md border">
            <h3 className="font-medium text-lg mb-2">Yuto Format</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-2/3">
                <p className="text-gray-700 mb-3">
                  Optimized for Yuto players, this format includes chapter markers for each story and is compatible with Yuto Cards. The audio file will be formatted according to Yuto's specifications with appropriate metadata.
                </p>
                <div className="text-sm border-l-4 border-purple-400 pl-3 py-1 bg-purple-50">
                  <p className="font-medium text-purple-800">New Feature: Custom Cover Images</p>
                  <p className="text-gray-700 mt-1">
                    When you export to Yuto format, we'll automatically generate a custom cover image for your playlist that displays on your Yuto player when the card is inserted. The image is specially designed to match your stories' themes.
                  </p>
                </div>
                
                <div className="mt-4">
                  <Button 
                    type="button"
                    className="w-full bg-purple-600 hover:bg-purple-700 mb-2 py-6 text-lg"
                    size="lg"
                    onClick={() => {
                      form.setValue("format", "yuto");
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={isExporting || selectedStories.length === 0}
                  >
                    {isExporting && form.getValues().format === "yuto" ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-5 w-5" />
                    )}
                    {isExporting && form.getValues().format === "yuto" ? "Exporting..." : "Export to Yuto Format"}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">Select your stories first, then click to export</p>
                </div>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 rounded-xl shadow-md overflow-hidden">
                    <img 
                      src="https://cdn.shopify.com/s/files/1/0588/0042/1610/files/3V2A3098_1_2048x.jpg?v=1651246987" 
                      alt="Yuto Player" 
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-2/3">
                <p className="text-gray-700 mb-4">
                  Formatted specifically for Toniebox audio players. This format includes the necessary metadata for Creative-Tonies and will work with your Toniebox player once transferred to your Tonie.
                </p>
                <Button 
                  type="button"
                  className="w-full bg-purple-600 hover:bg-purple-700 mb-2 py-6 text-lg"
                  size="lg"
                  onClick={() => {
                    form.setValue("format", "toniebox");
                    form.handleSubmit(onSubmit)();
                  }}
                  disabled={isExporting || selectedStories.length === 0}
                >
                  {isExporting && form.getValues().format === "toniebox" ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-5 w-5" />
                  )}
                  {isExporting && form.getValues().format === "toniebox" ? "Exporting..." : "Export to Toniebox Format"}
                </Button>
                <p className="text-xs text-gray-500 text-center">Select your stories first, then click to export</p>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-blue-600">
                    <path d="M4 2v20l2-1.33L8 22l2-1.33L12 22l2-1.33L16 22l2-1.33L20 22V2L4 2z" />
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 8v8" />
                    <path d="M8 10h8" />
                  </svg>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="audible" className="bg-white p-4 rounded-md border">
            <h3 className="font-medium text-lg mb-2">Audible Format</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-2/3">
                <p className="text-gray-700 mb-4">
                  Created to be compatible with Audible's AAX format, this export includes chapter markers, cover art (generated from the story content), and proper metadata for easy listening on Audible-compatible devices.
                </p>
                <Button 
                  type="button"
                  className="w-full bg-purple-600 hover:bg-purple-700 mb-2 py-6 text-lg"
                  size="lg"
                  onClick={() => {
                    form.setValue("format", "audible");
                    form.handleSubmit(onSubmit)();
                  }}
                  disabled={isExporting || selectedStories.length === 0}
                >
                  {isExporting && form.getValues().format === "audible" ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-5 w-5" />
                  )}
                  {isExporting && form.getValues().format === "audible" ? "Exporting..." : "Export to Audible Format"}
                </Button>
                <p className="text-xs text-gray-500 text-center">Select your stories first, then click to export</p>
              </div>
              <div className="md:w-1/3 flex items-center justify-center">
                <div className="w-32 h-32 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-orange-600">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}