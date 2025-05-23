import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-white to-blue-50 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-dark leading-tight">
              Create Magical <span className="text-primary">Audiobooks</span> for Your Little Ones
            </h2>
            <p className="text-lg mb-6 text-gray-600">
              Turn your ideas into captivating stories with AI-powered storytelling. Record and save audiobooks for Yoto, Toni, and Audible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Link href="#create">
                <Button className="bg-primary hover:bg-red-500 text-white font-bold py-7 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl w-full sm:w-auto">
                  Create New Story
                </Button>
              </Link>
              <Link href="/characters">
                <Button className="bg-red-500 hover:bg-red-600 text-white font-bold py-7 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl w-full sm:w-auto">
                  Create Characters
                </Button>
              </Link>
            </div>
            <div className="flex justify-start">
              <Link href="#examples">
                <Button variant="outline" className="bg-white hover:bg-gray-100 text-primary border-2 border-primary font-bold py-5 px-6 rounded-xl text-base shadow-md">
                  See Examples
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1635048424329-a9bfb146d7aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600" 
              alt="Child with magical storybook" 
              className="rounded-3xl shadow-2xl max-w-full md:max-w-md h-auto object-cover" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
