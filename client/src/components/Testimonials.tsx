import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf, Quote } from "lucide-react";

interface Testimonial {
  id: number;
  text: string;
  author: string;
  role: string;
  avatarUrl: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    text: "My daughter absolutely loves the personalized stories we create together. It's become our special bedtime ritual, and the Yoto cards make it feel extra special!",
    author: "Jessica T.",
    role: "Mother of two",
    avatarUrl: "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
    rating: 5
  },
  {
    id: 2,
    text: "As a dad who travels for work, I can record stories for my son even when I'm away. The AI helps me create engaging tales he loves, and I can share them through his Toniebox.",
    author: "Michael P.",
    role: "Father of one",
    avatarUrl: "https://pixabay.com/get/gbd2f9ea2955dfe7ca3ceb5c56cdce8d13194fd3f921edfa4707a07684d2a16d645b7a2f1307bac792e9796377e8889dc3bdd4f5c896106a8ecf8b5dffe35a503_1280.jpg",
    rating: 4.5
  }
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-center mb-12">What Families Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-white rounded-3xl shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="text-accent text-2xl mr-2">
                    <Quote />
                  </div>
                  <div className="flex-1">
                    <div className="flex text-accent">
                      {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
                        <Star key={i} className="fill-current" />
                      ))}
                      {testimonial.rating % 1 !== 0 && (
                        <StarHalf className="fill-current" />
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic mb-6">{testimonial.text}</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatarUrl} 
                    alt={testimonial.author} 
                    className="w-12 h-12 rounded-full object-cover mr-4" 
                  />
                  <div>
                    <h4 className="font-heading font-semibold">{testimonial.author}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
