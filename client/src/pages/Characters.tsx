import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type Character, characterCreationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Characters() {
  const { isAuthenticated, userId } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  
  // Get user's characters
  const { data: characters = [], isLoading, refetch } = useQuery({
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
  
  // Character creation form
  const form = useForm({
    resolver: zodResolver(characterCreationSchema),
    defaultValues: {
      name: "",
      appearance: "",
      personality: ""
    }
  });
  
  // Handle character creation
  const handleCreateCharacter = async (data: any) => {
    if (!isAuthenticated || !userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create characters",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Creating character with data:", { ...data, userId });
      
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId.toString()
        },
        body: JSON.stringify({
          name: data.name,
          appearance: data.appearance,
          personality: data.personality
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create character');
      }
      
      const result = await response.json();
      console.log("Character created:", result);
      
      toast({
        title: "Character created!",
        description: `${data.name} has been added to your character collection.`
      });
      
      // Reset form and close dialog
      form.reset();
      setIsCreating(false);
      refetch();
    } catch (error) {
      console.error("Error in character creation:", error);
      toast({
        title: "Error creating character",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Handle character editing
  const handleEditCharacter = async (data: any) => {
    if (!currentCharacter || !isAuthenticated || !userId) return;
    
    try {
      const response = await fetch(`/api/characters/${currentCharacter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId.toString()
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update character');
      }
      
      toast({
        title: "Character updated",
        description: `${data.name} has been updated.`
      });
      
      // Reset and close dialog
      setCurrentCharacter(null);
      setIsEditing(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error updating character",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Handle character deletion
  const handleDeleteCharacter = async (character: Character) => {
    if (!isAuthenticated || !userId) return;
    
    if (!confirm(`Are you sure you want to delete ${character.name}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'DELETE',
        headers: {
          'user-id': userId.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete character');
      }
      
      toast({
        title: "Character deleted",
        description: `${character.name} has been removed.`
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error deleting character",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  const openEditDialog = (character: Character) => {
    setCurrentCharacter(character);
    form.reset({
      name: character.name,
      appearance: character.appearance,
      personality: character.personality
    });
    setIsEditing(true);
  };
  
  const openCreateDialog = () => {
    form.reset({
      name: "",
      appearance: "",
      personality: ""
    });
    setIsCreating(true);
  };
  
  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Your Characters</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto">
          <User className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="mb-6">You need to sign in to create and manage your characters.</p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <a href="/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Characters</h1>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Create Character
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your characters...</p>
        </div>
      ) : characters.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Characters Yet</h2>
          <p className="text-gray-600 mb-6">
            Create characters to add to your stories. Characters can have unique personalities and appearances.
          </p>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Create Your First Character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character: Character) => (
            <Card key={character.id} className="overflow-hidden">
              <CardHeader className="bg-primary/5 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{character.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(character)}
                      title="Edit character"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteCharacter(character)}
                      title="Delete character"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs defaultValue="appearance">
                  <TabsList className="w-full">
                    <TabsTrigger value="appearance" className="flex-1">Appearance</TabsTrigger>
                    <TabsTrigger value="personality" className="flex-1">Personality</TabsTrigger>
                  </TabsList>
                  <TabsContent value="appearance" className="pt-4">
                    <p className="text-sm text-gray-700">{character.appearance}</p>
                  </TabsContent>
                  <TabsContent value="personality" className="pt-4">
                    <p className="text-sm text-gray-700">{character.personality}</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Character Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => {
          setIsCreating(open);
          if (!open) form.reset();
        }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Character</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new character for your stories.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCharacter)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Princess Elara" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="appearance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Appearance</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe how the character looks..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Include details like age, clothing, hair color, and other physical traits.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personality</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the character's personality traits..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Include details about traits, behaviors, likes, dislikes, and motivations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Character</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Character Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
            <DialogDescription>
              Update the details of your character.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditCharacter)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="appearance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Appearance</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personality</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}