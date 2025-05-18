import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface ExampleStory {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  ageRange: string;
}

const exampleStories: ExampleStory[] = [
  {
    id: 1,
    title: "The Mermaid's Treasure",
    description: "A young mermaid discovers a magical pearl that grants wishes, but learns that friendship is the greatest treasure of all.",
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    duration: "5-7 MIN",
    ageRange: "Ages 4-6"
  },
  {
    id: 2,
    title: "Forest Explorers",
    description: "Two siblings discover a hidden path in the woods that leads to a magical forest filled with talking animals.",
    imageUrl: "https://pixabay.com/get/ga76498930130a3002c1f92030e04e090a603a48e690a95db4ad3ca544d3eb73f9c6cf593bfc5f68f27e986a17999c9c5c9e60117ec7bc5d0f53e38d74439ba2e_1280.jpg",
    duration: "8-10 MIN",
    ageRange: "Ages 6-8"
  },
  {
    id: 3,
    title: "Beep's Space Journey",
    description: "A little robot named Beep gets separated from his spaceship and must navigate the stars to find his way home.",
    imageUrl: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
    duration: "12-15 MIN",
    ageRange: "Ages 7-10"
  }
];

export default function ExampleStories() {
  return (
    <section id="examples" className="py-16 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-center mb-12">Example Stories</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {exampleStories.map((story) => (
            <div key={story.id} className="bg-white rounded-3xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
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
                <h3 className="font-heading font-bold text-xl mb-2">{story.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{story.description}</p>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="bg-secondary bg-opacity-20 text-secondary font-semibold text-xs py-1 px-3 rounded-full">
                    {story.ageRange}
                  </Badge>
                  <Button variant="ghost" className="text-primary hover:text-purple transition-colors p-1">
                    <Play className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-heading font-bold py-6 px-8 rounded-xl">
            See More Examples
          </Button>
        </div>
      </div>
    </section>
  );
}
