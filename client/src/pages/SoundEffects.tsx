import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { SoundEffect } from "@shared/schema";
import { Plus, Trash, Play, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Sound effect categories
const categories = [
  "Weather",
  "Environment",
  "Animals",
  "Human",
  "Household",
  "Fantasy",
  "Other"
];

// Form validation schema
const uploadFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  category: z.string().min(1, { message: "Please select a category" }),
  soundFile: z.any()
    .refine(file => file instanceof FileList && file.length === 1, {
      message: "Please select a sound file"
    })
});

export default function SoundEffects() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Initialize audio player for previewing
  useState(() => {
    const audio = new Audio();
    setPreviewAudio(audio);
    return () => {
      audio.pause();
      audio.src = "";
    };
  });
  
  // Query to fetch sound effects
  const { data: soundEffects = [], isLoading: isFetchingEffects } = useQuery<SoundEffect[]>({
    queryKey: ['/api/sound-effects'],
    enabled: isAuthenticated,
  });
  
  // Get unique categories from sound effects
  const existingCategories = new Set<string>();
  soundEffects.forEach(effect => existingCategories.add(effect.category));
  const allCategories = ["All", ...Array.from(existingCategories)];
  
  // Filter effects by category
  const filteredEffects = selectedCategory === "All" 
    ? soundEffects 
    : soundEffects.filter(effect => effect.category === selectedCategory);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/sound-effects/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sound-effects'] });
      toast({
        title: "Sound effect deleted",
        description: "The sound effect was deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting sound effect:", error);
      toast({
        title: "Error",
        description: "Failed to delete sound effect",
        variant: "destructive",
      });
    }
  });
  
  // Form for uploading new sound effects
  const form = useForm<z.infer<typeof uploadFormSchema>>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      name: "",
      category: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof uploadFormSchema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to upload sound effects",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("category", values.category);
      formData.append("soundFile", values.soundFile[0]);
      
      // Upload file
      const response = await fetch("/api/sound-effects/upload", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, browser will set it with boundary
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload sound effect");
      }
      
      // Reset form and refresh data
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/sound-effects'] });
      toast({
        title: "Success!",
        description: "Sound effect uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading sound effect:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload sound effect",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Play a sound preview
  const playSoundPreview = (url: string) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.src = url;
      previewAudio.volume = 1.0;
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
  
  // Handle sound effect deletion
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this sound effect?")) {
      deleteMutation.mutate(id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You need to be logged in to view this page.</p>
          <Button asChild className="bg-primary">
            <a href="/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <Helmet>
        <title>Sound Effects Library | StoryTunes</title>
        <meta name="description" content="Upload and manage custom sound effects for your stories." />
      </Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-bold mb-4 sm:mb-0">Sound Effects</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto py-6 sm:text-lg">
              <Plus className="mr-2 h-5 w-5" /> Upload Sound Effect
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Upload Sound Effect</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter sound effect name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="soundFile"
                  render={({ field: { onChange, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Sound File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => onChange(e.target.files)}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    "Upload Sound Effect"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="mb-6">
        <label className="font-medium mb-2 block">Filter by Category:</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {allCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isFetchingEffects ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading sound effects...</p>
        </div>
      ) : filteredEffects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">No Sound Effects Found</h2>
          <p className="text-gray-600 mb-4">
            {selectedCategory === "All" 
              ? "Your sound effect library is empty. Upload some sound effects to get started!"
              : `You don't have any sound effects in the ${selectedCategory} category yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredEffects.map(effect => (
            <div key={effect.id} className="border rounded-lg p-4 hover:border-primary transition-all">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-lg truncate">{effect.name}</h3>
                <Badge variant="outline">{effect.category}</Badge>
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-primary"
                  onClick={() => playSoundPreview(effect.url)}
                >
                  <Play size={16} className="mr-1" /> Preview
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => handleDelete(effect.id)}
                >
                  <Trash size={16} className="mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-12 bg-gray-50 p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">About Sound Effects</h2>
        <p className="text-gray-700 mb-4">
          Sound effects can enhance your stories and make them more engaging for listeners. 
          Upload MP3 files to use in your stories, organize them by category, and add them at specific moments.
        </p>
        <p className="text-sm text-gray-500">
          Note: Sound effects are only available on Pro and Premium subscription plans.
        </p>
      </div>
    </div>
  );
}