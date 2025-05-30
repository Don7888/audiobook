import { Link } from "wouter";
import yotoImage from "@assets/yoto.png";
import tonieBoxImage from "@assets/Tonie Box.png";
import audibleImage from "@assets/audible.png";

interface Platform {
  name: string;
  description: string;
  imageUrl: string;
  buttonColor: string;
  learnMoreUrl: string;
}

const platforms: Platform[] = [
  {
    name: "Yoto Player",
    description: "Export your stories to physical cards that work with Yoto's kid-friendly audio players.",
    imageUrl: yotoImage,
    buttonColor: "bg-purple",
    learnMoreUrl: "#"
  },
  {
    name: "Toniebox",
    description: "Create custom content for your Toniebox figures that play your personalized stories.",
    imageUrl: tonieBoxImage,
    buttonColor: "bg-secondary",
    learnMoreUrl: "#"
  },
  {
    name: "Audible",
    description: "Export your stories in formats compatible with Audible and other audio platforms.",
    imageUrl: audibleImage,
    buttonColor: "bg-primary",
    learnMoreUrl: "#"
  }
];

export default function DownloadPlatforms() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-center mb-4">Use Your Stories Anywhere</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">Create and save your audio stories for use with popular platforms and devices</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {platforms.map((platform, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-br ${
                index === 0 ? 'from-purple-100 to-purple-200' : 
                index === 1 ? 'from-blue-100 to-blue-200' : 
                'from-orange-100 to-orange-200'
              } rounded-3xl p-6 shadow-md platform-card`}
            >
              <div className="mb-6 flex justify-center">
                <img 
                  src={platform.imageUrl} 
                  alt={`${platform.name}`} 
                  className="rounded-2xl h-40 w-40 object-cover" 
                />
              </div>
              <h3 className="font-heading font-bold text-xl mb-2 text-center">{platform.name}</h3>
              <p className="text-gray-600 text-center mb-6">{platform.description}</p>
              <Link href={platform.learnMoreUrl} className={`block ${platform.buttonColor} text-white text-center font-semibold py-3 rounded-xl hover:bg-opacity-90 transition-all`}>
                  Learn More
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
