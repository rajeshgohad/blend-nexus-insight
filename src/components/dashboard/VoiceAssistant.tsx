import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceCommand {
  patterns: RegExp[];
  action: string;
  description: string;
}

interface VoiceAssistantProps {
  onEquipmentFailure: () => void;
  onEmergencyStop: () => void;
  onEmergencyReset: () => void;
  onStartBatch: () => void;
  onStopBatch: () => void;
  onSuspendBatch: () => void;
  onResumeBatch: () => void;
  onTogglePause: () => void;
  onResetSimulation: () => void;
  onSetSpeed: (speed: number) => void;
}

const VOICE_COMMANDS: VoiceCommand[] = [
  {
    patterns: [
      /compression.*down/i,
      /equipment.*failure/i,
      /machine.*down/i,
      /use.*backup/i,
      /activate.*backup/i,
      /switch.*backup/i,
      /line.*1.*down/i,
    ],
    action: 'equipment-failure',
    description: 'Triggering equipment failure - switching to backup area',
  },
  {
    patterns: [
      /emergency.*stop/i,
      /e.?stop/i,
      /stop.*emergency/i,
      /halt.*production/i,
      /emergency.*halt/i,
    ],
    action: 'emergency-stop',
    description: 'Initiating emergency stop',
  },
  {
    patterns: [
      /reset.*emergency/i,
      /clear.*e.?stop/i,
      /emergency.*reset/i,
      /resume.*from.*emergency/i,
    ],
    action: 'emergency-reset',
    description: 'Resetting emergency stop',
  },
  {
    patterns: [
      /start.*batch/i,
      /begin.*batch/i,
      /initiate.*batch/i,
      /run.*batch/i,
      /start.*production/i,
    ],
    action: 'start-batch',
    description: 'Starting batch production',
  },
  {
    patterns: [
      /stop.*batch/i,
      /end.*batch/i,
      /terminate.*batch/i,
      /stop.*production/i,
    ],
    action: 'stop-batch',
    description: 'Stopping batch production',
  },
  {
    patterns: [
      /suspend.*batch/i,
      /pause.*batch/i,
      /hold.*batch/i,
    ],
    action: 'suspend-batch',
    description: 'Suspending batch',
  },
  {
    patterns: [
      /resume.*batch/i,
      /continue.*batch/i,
      /unpause.*batch/i,
    ],
    action: 'resume-batch',
    description: 'Resuming batch',
  },
  {
    patterns: [
      /pause.*simulation/i,
      /toggle.*pause/i,
      /freeze/i,
    ],
    action: 'toggle-pause',
    description: 'Toggling simulation pause',
  },
  {
    patterns: [
      /reset.*simulation/i,
      /restart.*simulation/i,
      /clear.*all/i,
    ],
    action: 'reset-simulation',
    description: 'Resetting simulation',
  },
  {
    patterns: [
      /speed.*(\d+)/i,
      /set.*speed.*(\d+)/i,
      /(\d+)x.*speed/i,
    ],
    action: 'set-speed',
    description: 'Setting simulation speed',
  },
  {
    patterns: [
      /slow.*down/i,
      /slower/i,
    ],
    action: 'speed-1x',
    description: 'Setting speed to 1x',
  },
  {
    patterns: [
      /speed.*up/i,
      /faster/i,
      /double.*speed/i,
    ],
    action: 'speed-2x',
    description: 'Setting speed to 2x',
  },
];

export function VoiceAssistant({
  onEquipmentFailure,
  onEmergencyStop,
  onEmergencyReset,
  onStartBatch,
  onStopBatch,
  onSuspendBatch,
  onResumeBatch,
  onTogglePause,
  onResetSimulation,
  onSetSpeed,
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(interimTranscript || finalTranscript);

      if (finalTranscript) {
        processCommand(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: 'Microphone Access Denied',
          description: 'Please enable microphone access to use voice commands.',
          variant: 'destructive',
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart if we're still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const processCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();
    
    for (const command of VOICE_COMMANDS) {
      for (const pattern of command.patterns) {
        const match = lowerText.match(pattern);
        if (match) {
          setLastCommand(command.description);
          
          toast({
            title: 'Voice Command Recognized',
            description: command.description,
          });

          // Execute the action
          switch (command.action) {
            case 'equipment-failure':
              onEquipmentFailure();
              break;
            case 'emergency-stop':
              onEmergencyStop();
              break;
            case 'emergency-reset':
              onEmergencyReset();
              break;
            case 'start-batch':
              onStartBatch();
              break;
            case 'stop-batch':
              onStopBatch();
              break;
            case 'suspend-batch':
              onSuspendBatch();
              break;
            case 'resume-batch':
              onResumeBatch();
              break;
            case 'toggle-pause':
              onTogglePause();
              break;
            case 'reset-simulation':
              onResetSimulation();
              break;
            case 'set-speed':
              const speedMatch = match[1];
              if (speedMatch) {
                const speed = parseInt(speedMatch, 10);
                if (speed >= 1 && speed <= 10) {
                  onSetSpeed(speed);
                }
              }
              break;
            case 'speed-1x':
              onSetSpeed(1);
              break;
            case 'speed-2x':
              onSetSpeed(2);
              break;
          }

          // Clear after a delay
          setTimeout(() => {
            setLastCommand(null);
            setTranscript('');
          }, 3000);

          return;
        }
      }
    }
  }, [
    onEquipmentFailure,
    onEmergencyStop,
    onEmergencyReset,
    onStartBatch,
    onStopBatch,
    onSuspendBatch,
    onResumeBatch,
    onTogglePause,
    onResetSimulation,
    onSetSpeed,
  ]);

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: 'Voice Assistant Active',
          description: 'Listening for commands... Try saying "compression machine down"',
        });
      } catch (error) {
        toast({
          title: 'Microphone Access Required',
          description: 'Please enable microphone access to use voice commands.',
          variant: 'destructive',
        });
      }
    }
  }, [isListening, toast]);

  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="text-muted-foreground"
        title="Speech recognition not supported in this browser"
      >
        <MicOff className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Listening indicator with transcript */}
      {isListening && (
        <div className="flex items-center gap-2 max-w-[200px]">
          <div className="flex gap-0.5">
            <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          {transcript && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {transcript}
            </span>
          )}
        </div>
      )}

      {/* Last command badge */}
      {lastCommand && (
        <Badge variant="outline" className="bg-success/20 text-success border-success/30 text-xs animate-in fade-in">
          <Volume2 className="w-3 h-3 mr-1" />
          {lastCommand}
        </Badge>
      )}

      {/* Mic button */}
      <Button
        variant={isListening ? 'default' : 'ghost'}
        size="sm"
        onClick={toggleListening}
        className={cn(
          'relative',
          isListening && 'bg-primary text-primary-foreground animate-pulse'
        )}
        title={isListening ? 'Stop listening' : 'Start voice commands'}
      >
        {isListening ? (
          <Mic className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        {isListening && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-ping" />
        )}
      </Button>
    </div>
  );
}
