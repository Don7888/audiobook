import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function AudioDownload() {
  const [audioFiles, setAudioFiles] = useState<string[]>([]);

  useEffect(() => {
    // This will execute once the component mounts
    fetch('/audio')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(html => {
        // Extract file names from the directory listing HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll('a')).filter(a => a.href.endsWith('.mp3'));
        const files = links.map(a => a.href.split('/').pop() || '');
        setAudioFiles(files);
      })
      .catch(error => {
        console.error('Error fetching audio files:', error);
        // Fallback to manually adding the latest files we know exist
        setAudioFiles([
          '1747599821735.mp3',
          '1747600097889.mp3',
          '1747600232555.mp3',
          '1747600592845.mp3',
          '1747600796762.mp3',
          '1747600843059.mp3'
        ]);
      });
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold mb-4">AI-Generated Story Audio</h1>
        <p className="text-center mb-6">
          Here are the audio files created using OpenAI's TTS voices. Each file is a children's
          story narrated in a different voice style.
        </p>
        <Link href="/">
          <Button variant="outline">Return to Home</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4">Voice Samples</h2>
          <p className="mb-4">
            The voices include: 
            <span className="font-semibold"> Female - Gentle (Nova), 
            Male - Cheerful (Echo), 
            Female - Animated (Shimmer), 
            Male - Storyteller (Onyx)</span>
          </p>
          
          {audioFiles.length > 0 ? (
            <div className="space-y-4">
              {audioFiles.map((file) => (
                <div key={file} className="border p-4 rounded-lg">
                  <p className="font-medium mb-2">{file}</p>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    <audio 
                      controls 
                      src={`/audio/${file}`} 
                      className="w-full mb-2"
                    >
                      Your browser does not support audio playback.
                    </audio>
                    
                    <a 
                      href={`/audio/${file}`} 
                      download={file}
                      className="no-underline"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2">
                        <Download size={16} />
                        <span>Download</span>
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Loading audio files...</p>
          )}
        </div>
      </div>
    </div>
  );
}