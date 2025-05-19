import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SoundEffect } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SoundEffectEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function SoundEffectEditor({ content, onChange }: SoundEffectEditorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch all sound effects for suggestions
  const { data: soundEffects = [] } = useQuery<SoundEffect[]>({
    queryKey: ['/api/sound-effects'],
    queryFn: async () => {
      const response = await fetch('/api/sound-effects');
      if (!response.ok) throw new Error('Failed to fetch sound effects');
      return response.json();
    }
  });

  // Filter sound effects based on search term
  const filteredEffects = searchTerm.length > 0
    ? soundEffects.filter(effect => 
        effect.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : soundEffects;

  // Handle textarea input changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
    checkForSfxTag(e.target);
  };

  // Check if user is typing [SFX: to show suggestions
  const checkForSfxTag = (textarea: HTMLTextAreaElement) => {
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    
    // Check if user is typing [SFX:
    const match = textBeforeCursor.match(/\[SFX:([^\]]*)$/);
    
    if (match) {
      setSearchTerm(match[1].trim());
      setShowSuggestions(true);
      
      // Position the suggestions dropdown
      const cursorCoords = getCaretCoordinates(textarea, cursorPos);
      setCursorPosition({
        top: cursorCoords.top + 20,
        left: cursorCoords.left
      });
    } else {
      setShowSuggestions(false);
      setSearchTerm('');
    }
  };

  // Insert a sound effect at cursor position
  const insertSoundEffect = (effect: SoundEffect) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const textAfterCursor = textarea.value.substring(cursorPos);
    
    // Find the "[SFX:" text that was being typed
    const match = textBeforeCursor.match(/\[SFX:[^\]]*$/);
    
    if (match) {
      // Replace the partial [SFX: with the complete tag
      const newBeforeText = textBeforeCursor.substring(0, cursorPos - match[0].length);
      const newContent = `${newBeforeText}[SFX:${effect.name}]${textAfterCursor}`;
      
      onChange(newContent);
      
      // Position cursor after the inserted tag
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = newBeforeText.length + `[SFX:${effect.name}]`.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    
    setShowSuggestions(false);
  };

  // Helper function to get caret coordinates in a textarea
  const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    // Creating a dummy element to measure position
    const dummyElement = document.createElement('div');
    dummyElement.style.position = 'absolute';
    dummyElement.style.visibility = 'hidden';
    dummyElement.style.whiteSpace = 'pre-wrap';
    dummyElement.style.font = window.getComputedStyle(element).font;
    dummyElement.style.padding = window.getComputedStyle(element).padding;
    dummyElement.style.width = window.getComputedStyle(element).width;
    dummyElement.style.lineHeight = window.getComputedStyle(element).lineHeight;
    
    const text = element.value.substring(0, position);
    dummyElement.textContent = text;
    
    // Add a span to mark the position
    const marker = document.createElement('span');
    marker.textContent = '|';
    dummyElement.appendChild(marker);
    
    document.body.appendChild(dummyElement);
    
    const markerPosition = {
      top: marker.offsetTop,
      left: marker.offsetLeft
    };
    
    document.body.removeChild(dummyElement);
    
    return markerPosition;
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current !== event.target
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShowSuggestions(false);
          }
        }}
        className="w-full min-h-[200px] p-4 bg-white border border-gray-200 rounded-lg text-base focus:border-primary focus:ring-1 focus:ring-primary"
        placeholder="Edit your story here... Type [SFX: to add sound effects"
      />
      
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10"
          style={{
            top: `${cursorPosition.top}px`,
            left: `${cursorPosition.left}px`,
          }}
        >
          <Card className="w-64 shadow-md border border-gray-200">
            <CardContent className="p-0">
              <ScrollArea className="h-[200px] p-0">
                <div className="p-1">
                  <p className="text-xs text-muted-foreground px-2 py-1.5">
                    Sound Effects
                  </p>
                  {filteredEffects.length > 0 ? (
                    <div className="space-y-0.5">
                      {filteredEffects.map((effect) => (
                        <button
                          key={effect.id}
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => insertSoundEffect(effect)}
                        >
                          {effect.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-2">
                      No matching sound effects found
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}