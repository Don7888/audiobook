import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { useState } from "react";

interface ExampleStory {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  ageRange: string;
  audioUrl?: string;
}

const exampleStories: ExampleStory[] = [
  {
    id: 1,
    title: "Henry The Space Explorer",
    description:
      "When space pirates steal Vesper’s magical Golden Cat, young explorer Henry sets off in his starship to save the day — using bravery, heart, and starlight to restore joy to the galaxy.",
    imageUrl: "/HenrySpace.png",
    duration: "4+ MINs",
    ageRange: "Ages 3-6",
    audioUrl: "/sounds/Story/Henry the Star Explorer and the Golden Cat of Vesper.mp3",
  },
  {
    id: 2,
    title: "The Alphabet Jungle Adventure",
    description:
      "Join the dancing letters as they explore their magical jungle home, learning sounds and making friends in this educational adventure.",
    imageUrl: "/AlphaJungle.png",
    duration: "2-3 MIN",
    ageRange: "Ages 2-3",
    audioUrl: "/sounds/Story/Alphabet Jungle.mp3",
  },
  {
    id: 3,
    title: "Eva Beaver",
    description:
      "A curious beaver named Eva discovers a magical clearing of dancing fairies and joins their joyful celebration, leaving with a crystal flower and a heart full of wonder.",
    imageUrl: "/EvaBeaver.png",
    duration: "1-2 MIN",
    ageRange: "Ages 6-8",
    audioUrl: "/sounds/Story/Eva Beaver.mp3"
  },
];

export default function ExampleStories() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  const handlePlayAudio = (story: ExampleStory) => {
    if (!story.audioUrl) return;

    // Stop any currently playing audio
    if (currentlyPlaying !== null) {
      const currentAudio = document.getElementById(
        `audio-${currentlyPlaying}`,
      ) as HTMLAudioElement;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Play the selected audio
    const audio = document.getElementById(
      `audio-${story.id}`,
    ) as HTMLAudioElement;
    if (audio) {
      if (currentlyPlaying === story.id) {
        // If clicking the same story, pause it
        audio.pause();
        setCurrentlyPlaying(null);
      } else {
        // Play the new story
        audio.play();
        setCurrentlyPlaying(story.id);

        // Reset when audio ends
        audio.onended = () => {
          setCurrentlyPlaying(null);
        };
      }
    }
  };

  return (
    <section
      id="examples"
      className="py-16 bg-gradient-to-b from-blue-50 to-white"
    >
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-center mb-12">
          Example Stories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {exampleStories.map((story) => (
            <div
              key={story.id}
              className="bg-white rounded-3xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
            >
              <div className="relative">
                <img
                  src={story.imageUrl}
                  alt={`${story.title} illustration`}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-accent text-dark font-bold text-xs py-1 px-3 rounded-full">
                  {story.duration}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-heading font-bold text-xl mb-2">
                  {story.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {story.description}
                </p>
                <div className="flex justify-between items-center">
                  <Badge
                    variant="secondary"
                    className="bg-secondary bg-opacity-20 text-secondary font-semibold text-xs py-1 px-3 rounded-full"
                  >
                    {story.ageRange}
                  </Badge>
                  {story.audioUrl ? (
                    <>
                      <Button
                        variant="ghost"
                        className="text-primary hover:text-purple transition-colors p-1"
                        onClick={() => handlePlayAudio(story)}
                      >
                        <Play
                          className={`h-6 w-6 ${currentlyPlaying === story.id ? "text-purple-600" : ""}`}
                        />
                      </Button>
                      <audio id={`audio-${story.id}`} preload="metadata">
                        <source src={story.audioUrl} type="audio/mpeg" />
                      </audio>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      className="text-gray-400 cursor-not-allowed p-1"
                      disabled
                    >
                      <Play className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-heading font-bold py-6 px-8 rounded-xl"
          >
            See More Examples
          </Button>
        </div>
      </div>
    </section>
  );
}
