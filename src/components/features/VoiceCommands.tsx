import React, { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface VoiceCommandsProps {
  onCommand: (command: string, value?: string | number) => void;
  isActive?: boolean;
}

const COMMANDS = {
  'add': ['add', 'plus', 'include'],
  'remove': ['remove', 'delete', 'minus'],
  'checkout': ['checkout', 'pay', 'bill', 'payment'],
  'clear': ['clear', 'reset', 'cancel', 'void'],
  'discount': ['discount', 'off', 'percentage'],
  'quantity': ['quantity', 'qty', 'pieces', 'units'],
  'search': ['search', 'find', 'look for'],
  'hold': ['hold', 'park', 'save'],
  'print': ['print', 'receipt'],
};

export function VoiceCommands({ onCommand, isActive = true }: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const processCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();
    
    // Parse numbers from text
    const numbers = lowerText.match(/\d+/);
    const value = numbers ? parseInt(numbers[0]) : undefined;

    // Check each command category
    for (const [command, keywords] of Object.entries(COMMANDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        onCommand(command, value);
        toast.success(`Command: ${command}${value ? ` (${value})` : ''}`);
        return true;
      }
    }

    // Product search - if no command matched, treat as search
    if (lowerText.length > 2) {
      onCommand('search', lowerText);
      return true;
    }

    return false;
  }, [onCommand]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Voice commands not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      setTranscript(text);
      
      if (result.isFinal) {
        processCommand(text);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isSupported, processCommand]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2">
      {transcript && (
        <Badge variant="secondary" className="animate-pulse max-w-[200px] truncate">
          <Volume2 className="w-3 h-3 mr-1" />
          {transcript}
        </Badge>
      )}
      
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={isListening ? stopListening : startListening}
        disabled={!isSupported}
        className="relative"
        title={isSupported ? "Voice commands" : "Not supported"}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
      
      {!isSupported && (
        <AlertCircle className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  );
}
