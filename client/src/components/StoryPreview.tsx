import { Button } from "@/components/ui/button";
import { Save, Edit } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import { GeneratedStory, saveStory } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { SoundEffectPlacement } from "@shared/schema";
import SoundEffectEditor from "./SoundEffectEditor";

interface StoryPreviewProps {
  story: GeneratedStory;
  audioUrl: string;
  onEdit?: () => void;
  soundEffects?: SoundEffectPlacement[];
  characterIds?: number[];
}

export default function StoryPreview({ story, audioUrl, onEdit, soundEffects = [], characterIds = [] }: StoryPreviewProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(story.content);
  const [storyImage, setStoryImage] = useState<string>("https://pixabay.com/get/g9abdb05c255a115ab332e9d29d18bb736f3500a42a629e61cda8d0afb1de96c3d8206ec5ca044c5b631f6fb8856065a60252c1dca34ad487a985001046dab40d_1280.jpg");
  
  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes when exiting edit mode
      setIsEditing(false);
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };
  
  // Use AI to select an appropriate image based on the story content
  useEffect(() => {
    // In a real implementation, we would call an image selection API
    // For now, we're using a fixed set of images based on story type
    if (story.content.toLowerCase().includes("dragon")) {
      setStoryImage("https://pixabay.com/get/g9abdb05c255a115ab332e9d29d18bb736f3500a42a629e61cda8d0afb1de96c3d8206ec5ca044c5b631f6fb8856065a60252c1dca34ad487a985001046dab40d_1280.jpg");
    } else if (story.content.toLowerCase().includes("ocean") || story.content.toLowerCase().includes("sea") || story.content.toLowerCase().includes("mermaid")) {
      setStoryImage("https://pixabay.com/get/g5c67fae3fed1f4eafe336f991398af96dc67d1953b5b8607ded47d4ddec03a8f5ea6f0de3da2b8fcac6a6bc0d68e9bfacdf5a6a4ce2a82702c6f34f0a6e2050e_1280.jpg");
    } else if (story.content.toLowerCase().includes("forest") || story.content.toLowerCase().includes("tree")) {
      setStoryImage("https://pixabay.com/get/ga76498930130a3002c1f92030e04e090a603a48e690a95db4ad3ca544d3eb73f9c6cf593bfc5f68f27e986a17999c9c5c9e60117ec7bc5d0f53e38d74439ba2e_1280.jpg");
    } else if (story.content.toLowerCase().includes("space") || story.content.toLowerCase().includes("star") || story.content.toLowerCase().includes("planet")) {
      setStoryImage("https://pixabay.com/get/g9f93a99d59fb4d41c579df851b8a62e0e1a0b8a0cd5af88d5399ab9e72e9eae5d02cf33b88d2a1c92fc79f31b8bc8e0d_1280.jpg");
    }
  }, [story.content]);
  
  const handleSaveToLibrary = async () => {
    try {
      setIsSaving(true);
      
      await saveStory({
        title: story.title,
        text: story.content,
        prompt: "User prompt", // This would come from the form
        ageRange: "3-5 years", // These would be passed from the parent component
        storyLength: "Short (2-3 min)",
        storyType: "Adventure",
        narrator: "Female - Gentle",
        audioUrl: audioUrl,
        soundEffects: soundEffects,
        characterIds: characterIds.length > 0 ? characterIds : undefined
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      
      toast({
        title: "Success!",
        description: "Your story has been saved to your library.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row">
      <div className="md:w-1/3 bg-secondary p-6 flex items-center justify-center">
        <img 
          src={storyImage} 
          alt="Story illustration" 
          className="rounded-2xl shadow-md book-cover" 
        />
      </div>
      
      <div className="md:w-2/3 p-6">
        <h3 className="font-heading font-bold text-2xl mb-4">{story.title}</h3>
        
        {isEditing ? (
          <div className="mb-6">
            <SoundEffectEditor 
              content={editableContent} 
              onChange={setEditableContent} 
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 mb-6 max-h-60 overflow-y-auto shadow-inner">
            {story.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-3">
                {paragraph.split(/(\[SFX:[^\]]+\])/).map((part, i) => {
                  if (part.match(/\[SFX:[^\]]+\]/)) {
                    // Extract sound effect name
                    const effectName = part.replace(/\[SFX:([^\]]+)\]/, '$1');
                    return (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        🔊 {effectName}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </p>
            ))}
          </div>
        )}
        
        <AudioPlayer 
          audioUrl={audioUrl} 
          storyText={isEditing ? editableContent : story.content} 
        />
        
        {soundEffects && soundEffects.length > 0 && (
          <div className="mt-4 bg-blue-50 rounded-xl p-3">
            <p className="text-sm font-medium text-blue-700 mb-1">This story includes {soundEffects.length} sound effects</p>
            <p className="text-xs text-blue-600">Sound effects will play automatically during story playback</p>
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <Button
            onClick={handleToggleEdit}
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-heading font-bold flex items-center"
          >
            <Edit className="mr-2" /> {isEditing ? "Done Editing" : "Edit Sound Effects"}
          </Button>
          
          <Button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className="bg-accent hover:bg-yellow-400 text-dark font-heading font-bold shadow-md hover:shadow-lg flex items-center"
          >
            <Save className="mr-2" /> Save to Library
          </Button>
        </div>
      </div>
    </div>
  );
}
