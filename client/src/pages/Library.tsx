import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Story, Character } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Download, Trash2, Users } from "lucide-react";
import AudioPlayer from "@/components/AudioPlayer";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";

export default function Library() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const { toast } = useToast();
  
  // Fetch all stories
  const { data: stories, isLoading, isError } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    queryFn: async () => {
      const response = await fetch('/api/stories', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json();
    }
  });
  
  // Fetch all characters
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
    queryFn: async () => {
      const response = await fetch('/api/characters', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch characters');
      return response.json();
    }
  });
  
  // Delete a story
  const handleDeleteStory = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/stories/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      
      if (selectedStory?.id === id) {
        setSelectedStory(null);
      }
      
      toast({
        title: "Story Deleted",
        description: "Your story has been removed from your library.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Export to platform (simulation)
  const handleExportToPlatform = (platform: string) => {
    toast({
      title: `Exported to ${platform}`,
      description: "Your story has been prepared for your device.",
    });
  };
  
  return (
    <>
      <Helmet>
        <title>My Library - StoryTunes</title>
        <meta name="description" content="Access your saved audiobooks in your personal StoryTunes library. Listen, edit, or export your stories to Yoto, Toni, and Audible." />
      </Helmet>
      <div className="bg-light min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-center mb-8">My Story Library</h1>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Story List */}
            <div className="lg:w-1/3">
              <Card className="bg-white rounded-3xl shadow-md">
                <CardContent className="p-6">
                  <h2 className="font-heading font-bold text-xl mb-4">Your Stories</h2>
                  
                  {isLoading && (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {isError && (
                    <div className="text-center py-8">
                      <p className="text-red-500">Failed to load stories</p>
                      <Button 
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/stories'] })}
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                  
                  {stories && stories.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">You haven't created any stories yet</p>
                      <Button 
                        onClick={() => window.location.href = '/'}
                        className="mt-4 bg-primary text-white"
                      >
                        Create Your First Story
                      </Button>
                    </div>
                  )}
                  
                  {stories && stories.length > 0 && (
                    <div className="space-y-4">
                      {stories.map((story) => (
                        <Card 
                          key={story.id}
                          className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedStory?.id === story.id ? 'border-primary border-2' : ''}`}
                          onClick={() => setSelectedStory(story)}
                        >
                          <h3 className="font-heading font-bold">{story.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{story.text.substring(0, 100)}...</p>
                          
                          {/* Show character indicators */}
                          {story.characterIds && story.characterIds.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users size={12} className="text-primary" />
                              <span className="text-xs text-primary">{story.characterIds.length} character{story.characterIds.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(story.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="text-primary h-8 w-8 p-0">
                                <Play size={16} />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0">
                                    <Trash2 size={16} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{story.title}" from your library.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteStory(story.id)}
                                      className="bg-red-500 text-white hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Story Details */}
            <div className="lg:w-2/3">
              {selectedStory ? (
                <Card className="bg-white rounded-3xl shadow-md">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="font-heading font-bold text-2xl">{selectedStory.title}</h2>
                      <div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="text-red-500">
                              <Trash2 className="mr-2" size={16} /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{selectedStory.title}" from your library.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteStory(selectedStory.id)}
                                className="bg-red-500 text-white hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="bg-blue-50 rounded-2xl p-4 max-h-60 overflow-y-auto">
                        {selectedStory.text.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="mb-3">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                    
                    {/* Show story characters if any */}
                    {selectedStory.characterIds && selectedStory.characterIds.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={16} className="text-primary" />
                          <h3 className="font-heading font-semibold">Characters in this story:</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedStory.characterIds.map(characterId => {
                            const character = characters.find(c => c.id === characterId);
                            return character ? (
                              <Badge key={characterId} variant="outline" className="bg-blue-50 text-primary border-primary">
                                {character.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    <AudioPlayer audioUrl={selectedStory.audioUrl} />
                    
                    <div className="mt-8">
                      <h3 className="font-heading font-semibold mb-4">Export Options</h3>
                      <Tabs defaultValue="yoto">
                        <TabsList className="grid grid-cols-3 mb-4">
                          <TabsTrigger value="yoto">Yoto</TabsTrigger>
                          <TabsTrigger value="toni">Toniebox</TabsTrigger>
                          <TabsTrigger value="audible">Audible</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="yoto" className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Export your story to a Yoto card that can be played on any Yoto player device.
                          </p>
                          <Button 
                            onClick={() => handleExportToPlatform('Yoto')}
                            className="bg-purple text-white"
                          >
                            <Download className="mr-2" size={16} /> Export to Yoto
                          </Button>
                        </TabsContent>
                        
                        <TabsContent value="toni" className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Create a custom Tonie figure with your story that works with any Toniebox.
                          </p>
                          <Button 
                            onClick={() => handleExportToPlatform('Toniebox')}
                            className="bg-secondary text-white"
                          >
                            <Download className="mr-2" size={16} /> Export to Toniebox
                          </Button>
                        </TabsContent>
                        
                        <TabsContent value="audible" className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Download your story in a format compatible with Audible and other audio platforms.
                          </p>
                          <Button 
                            onClick={() => handleExportToPlatform('Audible')}
                            className="bg-primary text-white"
                          >
                            <Download className="mr-2" size={16} /> Export to Audible
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white rounded-3xl shadow-md h-full flex items-center justify-center">
                  <CardContent className="p-12 text-center">
                    <h2 className="font-heading font-bold text-2xl mb-4">Select a Story</h2>
                    <p className="text-gray-600">
                      Choose a story from your library to view details, listen to audio, and export options.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
