import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CallToAction() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary to-purple">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-6">Ready to Create Magical Stories?</h2>
        <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
          Start creating personalized audiobooks that will inspire imagination and create lasting memories.
        </p>
        <Link href="#create">
          <Button className="bg-white text-primary hover:bg-gray-100 font-heading font-bold text-lg py-7 px-10 rounded-2xl shadow-lg hover:shadow-xl">
            Get Started for Free
          </Button>
        </Link>
        <p className="text-white text-sm mt-4 opacity-80">No credit card required. Create up to 3 stories free.</p>
      </div>
    </section>
  );
}
