import { Helmet } from "react-helmet";
import { Volume2 } from "lucide-react";

export default function SoundEffects() {
  return (
    <div className="container mx-auto py-12">
      <Helmet>
        <title>Sound Effects Library | nabli</title>
        <meta name="description" content="Sound effects library coming soon for enhanced storytelling." />
      </Helmet>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Sound Effects Library</h1>
        <p className="text-xl text-gray-600 mb-8">
          Enhance your stories with our collection of high-quality sound effects
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl p-12 text-center border border-purple-200 max-w-4xl mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
          <Volume2 className="w-10 h-10 text-purple-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          We're working on an amazing sound effects library that will let you add custom audio effects to your stories. 
          For now, our narrators naturally include sound effects by speaking them as part of the story.
        </p>
        
        <div className="bg-white rounded-xl p-6 max-w-lg mx-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Current Sound Effects</h3>
          <p className="text-sm text-gray-600">
            Our AI narrators already include sound effects like "meow meow", "woof woof", 
            "rumble rumble boom" and more as natural parts of your stories.
          </p>
        </div>
      </div>
    </div>
  );
}