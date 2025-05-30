import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Save, X, Volume2, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AudioPlayer from "./AudioPlayer";
import { GeneratedStory } from "@/lib/openai";
import { useQueryClient } from "@tanstack/react-query";

interface EditableStoryPreviewProps {
  story: GeneratedStory;
  audioUrl: string;
  narrator: string;
  userId: number;
  onStoryUpdate?: (updatedStory: GeneratedStory, newAudioUrl: string) => void;
  storyIndex?: number; // For batch stories
}

export default function EditableStoryPreview({
  story,
  audioUrl,
  narrator,
  userId,
  onStoryUpdate,
  storyIndex
}: EditableStoryPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(story.content);
  const [editedTitle, setEditedTitle] = useState(story.title);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!editedContent.trim() || !editedTitle.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both title and story content",
        variant: "destructive"
      });
      return;
    }

    // Check for inappropriate content before generating audio
    const inappropriateTerms = [
      'violence', 'death', 'kill', 'murder', 'blood', 'war', 'fight', 'gun', 'weapon',
      'scary', 'horror', 'nightmare', 'demon', 'ghost', 'zombie',
      'adult', 'mature', 'inappropriate', 'explicit', 'hate', 'racist', 'discrimination'
    ];
    
    const lowerContent = editedContent.toLowerCase();
    const lowerTitle = editedTitle.toLowerCase();
    const hasInappropriateContent = inappropriateTerms.some(term => 
      lowerContent.includes(term) || lowerTitle.includes(term)
    );

    if (hasInappropriateContent) {
      toast({
        title: "Inappropriate Content Detected",
        description: "Your story contains inappropriate language or themes. Please edit the content to remove any violent, scary, or mature themes before generating audio.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRegenerating(true);

      // Generate new audio for the edited story
      const audioResponse = await fetch('/api/stories/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editedContent,
          voice: narrator,
          userId: userId,
          title: editedTitle
        })
      });

      if (!audioResponse.ok) {
        throw new Error('Failed to generate audio');
      }

      const { audioUrl: newAudioUrl } = await audioResponse.json();

      // Create updated story object
      const updatedStory: GeneratedStory = {
        ...story,
        title: editedTitle,
        content: editedContent
      };

      // Call the callback to update parent component
      if (onStoryUpdate) {
        onStoryUpdate(updatedStory, newAudioUrl);
      }

      setIsEditing(false);
      
      toast({
        title: "Story Updated!",
        description: "Your story has been edited and new audio generated successfully.",
      });

    } catch (error) {
      console.error('Error updating story:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update story and generate new audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(story.content);
    setEditedTitle(story.title);
    setIsEditing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-primary outline-none flex-1 mr-4"
            placeholder="Story title..."
          />
        ) : (
          <CardTitle className="text-2xl">{story.title}</CardTitle>
        )}
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isRegenerating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Regenerate Audio
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isRegenerating}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Story
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[200px] text-gray-700 leading-relaxed"
            placeholder="Write your story here..."
          />
        ) : (
          <div className="prose max-w-none p-4 bg-gray-50 rounded-lg">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {story.content}
            </div>
          </div>
        )}

        {!isEditing && audioUrl && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-gray-700">Audio Narration</span>
            </div>
            <AudioPlayer
              audioUrl={audioUrl}
              className="w-full"
              storyText={story.content}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}