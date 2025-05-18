import { Pencil, MoveUp, Download } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white" id="how-it-works">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-blue-50 rounded-3xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
              <Pencil size={24} />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3">1. Create Your Story</h3>
            <p className="text-gray-600">Use our AI storyteller to generate a unique tale based on your ideas.</p>
          </div>
          
          <div className="bg-blue-50 rounded-3xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
              <MoveUp size={24} />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3">2. Generate Audio</h3>
            <p className="text-gray-600">Convert your story to an engaging audiobook with natural-sounding voices.</p>
          </div>
          
          <div className="bg-blue-50 rounded-3xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-dark text-2xl mx-auto mb-4">
              <Download size={24} />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3">3. Save & Share</h3>
            <p className="text-gray-600">Download your audiobook or save it to use with Yoto, Toni, or Audible devices.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
