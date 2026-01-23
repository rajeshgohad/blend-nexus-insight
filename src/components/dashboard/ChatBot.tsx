import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MOCK_RESPONSES: Record<string, string> = {
  batch: "The current batch is processing through the blending phase. You can monitor real-time parameters in the Digital Twin tab.",
  maintenance: "Predictive maintenance monitors equipment health using vibration, temperature, and motor load sensors. Check the Maintenance tab for component status.",
  yield: "Yield optimization uses AI to detect parameter drift and recommend adjustments. The Yield tab shows real-time tablet compression metrics.",
  vision: "Computer Vision QC performs real-time defect detection on tablets and packaging. View detections in the Vision QC tab.",
  schedule: "The scheduling system optimizes batch sequencing based on equipment availability and resource constraints.",
  help: "I can help with:\n• Batch status and parameters\n• Maintenance predictions\n• Yield optimization\n• Vision QC detections\n• Production scheduling\n\nJust ask about any of these topics!",
  default: "I'm your PharmaMES AI Assistant. I can help you understand the manufacturing dashboard, explain metrics, and provide guidance on batch operations. Try asking about batch status, maintenance, yield, or scheduling."
};

function getMockResponse(input: string): string {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('batch') || lowerInput.includes('blend') || lowerInput.includes('process')) {
    return MOCK_RESPONSES.batch;
  }
  if (lowerInput.includes('maintenance') || lowerInput.includes('health') || lowerInput.includes('equipment')) {
    return MOCK_RESPONSES.maintenance;
  }
  if (lowerInput.includes('yield') || lowerInput.includes('tablet') || lowerInput.includes('compression')) {
    return MOCK_RESPONSES.yield;
  }
  if (lowerInput.includes('vision') || lowerInput.includes('qc') || lowerInput.includes('defect') || lowerInput.includes('camera')) {
    return MOCK_RESPONSES.vision;
  }
  if (lowerInput.includes('schedule') || lowerInput.includes('order') || lowerInput.includes('production')) {
    return MOCK_RESPONSES.schedule;
  }
  if (lowerInput.includes('help') || lowerInput.includes('what can')) {
    return MOCK_RESPONSES.help;
  }
  
  return MOCK_RESPONSES.default;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your PharmaMES AI Assistant. How can I help you today? Try asking about batch status, maintenance, or yield optimization.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = getMockResponse(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">AI Assistant</span>
      </Button>

      {/* Chat Window Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Window */}
          <div className="relative w-full max-w-md h-[500px] bg-background border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">PharmaMES Assistant</h3>
                  <p className="text-xs text-muted-foreground">AI-powered help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.content}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about the dashboard..."
                  className="flex-1 text-sm"
                  disabled={isTyping}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
