import { BookOpen } from "lucide-react";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="text-primary text-3xl mr-2">
                <BookOpen />
              </div>
              <h3 className="font-heading font-bold text-2xl text-primary">StoryTunes</h3>
            </div>
            <p className="text-gray-400 mb-4">Creating magical audiobook experiences for children and families.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Features</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Story Creation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Voice Generation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Platform Export</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Library Management</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Story Prompts</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Device Guides</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} StoryTunes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
