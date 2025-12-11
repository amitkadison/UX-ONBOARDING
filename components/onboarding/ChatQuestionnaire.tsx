/**
 * ChatQuestionnaire Component
 * Full conversational chat flow for onboarding questions
 * Uses Agent B prompt for natural conversation with business type classification
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceSelector } from './ServiceSelector';
import { safeToonEncodeString } from '@/lib/toon-utils';

// Helper to maintain existing API (body + contentType)
function safeToonEncode(data: unknown): { body: string; contentType: string } {
  return { body: safeToonEncodeString(data), contentType: 'text/plain' };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatQuestionnaireProps {
  onComplete: (answers: Record<string, string>) => void;
  businessContext?: {
    companyName?: string;
    industry?: string;
    services?: string[];
  };
}

type Phase = 'services' | 'chat' | 'complete';

export function ChatQuestionnaire({
  onComplete,
  businessContext,
}: ChatQuestionnaireProps) {
  // Phase management
  const [phase, setPhase] = useState<Phase>('services');

  // Services state
  const [selectedServices, setSelectedServices] = useState<string[]>(
    businessContext?.services || []
  );
  const [allServices, setAllServices] = useState<string[]>(
    businessContext?.services || []
  );

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, string>>({});
  const [isConversationComplete, setIsConversationComplete] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when entering chat phase
  useEffect(() => {
    if (phase === 'chat' && !isLoading) {
      inputRef.current?.focus();
    }
  }, [phase, isLoading]);

  // Start chat with initial greeting when entering chat phase
  const startChat = useCallback(async () => {
    setPhase('chat');
    setIsLoading(true);

    try {
      const { body, contentType } = safeToonEncode({
        messages: [],
        businessContext: {
          ...businessContext,
          services: selectedServices,
        },
        isInitial: true,
      });

      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      });

      const data = await response.json();

      if (data.success && data.message) {
        setMessages([{ role: 'assistant', content: data.message }]);
      } else {
        // Fallback greeting
        setMessages([{
          role: 'assistant',
          content: `שלום! אני כאן כדי להכיר את העסק שלך - ${businessContext?.companyName || 'העסק'}. בואו נדבר על השירותים שבחרת ונבין יחד מה מיוחד בהם. ספר לי קצת, מה הופך את העסק שלך למיוחד?`
        }]);
      }
    } catch (error) {
      console.error('[ChatQuestionnaire] Initial greeting error:', error);
      setMessages([{
        role: 'assistant',
        content: `שלום! אני כאן כדי להכיר את העסק שלך. ספר לי קצת על השירותים שאתה מציע ומה מיוחד בהם.`
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [businessContext, selectedServices]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { body, contentType } = safeToonEncode({
        messages: [...messages, { role: 'user', content: userMessage }],
        businessContext: {
          ...businessContext,
          services: selectedServices,
        },
        collectedAnswers,
      });

      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

        // Update collected answers if provided
        if (data.answers) {
          setCollectedAnswers(prev => ({ ...prev, ...data.answers }));
        }

        // Check if conversation is complete
        if (data.isComplete) {
          setIsConversationComplete(true);
          // Merge final answers
          if (data.finalAnswers) {
            setCollectedAnswers(prev => ({ ...prev, ...data.finalAnswers }));
          }
        }
      } else {
        console.error('[ChatQuestionnaire] API error:', data.error);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'סליחה, יש בעיה טכנית. אפשר לנסות שוב?' },
        ]);
      }
    } catch (error) {
      console.error('[ChatQuestionnaire] Network error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'סליחה, בעיית תקשורת. אפשר לנסות שוב?' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle completing the questionnaire
  const handleComplete = () => {
    // Add selected services to answers
    const finalAnswers = {
      ...collectedAnswers,
      Priority_Selection: selectedServices.join(', '),
    };
    onComplete(finalAnswers);
  };

  // Render services selection phase
  if (phase === 'services') {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto" dir="rtl">
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              בחר את השירותים שתרצה לפרסם
            </h3>
            <p className="text-sm text-muted-foreground">
              בחר את השירותים העיקריים שאתה רוצה להתמקד בהם. אפשר גם להוסיף או למחוק שירותים.
            </p>
          </div>

          <ServiceSelector
            services={allServices}
            selectedServices={selectedServices}
            onSelectionChange={setSelectedServices}
            onServicesChange={setAllServices}
          />

          <div className="flex items-center justify-between pt-6 border-t mt-6">
            <span className="text-sm text-muted-foreground">
              {selectedServices.length > 0
                ? `נבחרו ${selectedServices.length} שירותים`
                : 'בחר לפחות שירות אחד'}
            </span>
            <Button
              onClick={startChat}
              disabled={selectedServices.length === 0}
              className="gap-2"
            >
              המשך לשיחה
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render chat phase
  return (
    <div className="animate-fade-in max-w-2xl mx-auto" dir="rtl">
      <Card className="flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">יועץ השיווק</h3>
            <p className="text-sm text-muted-foreground">
              בואו נכיר את העסק שלך
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-3 animate-fade-in',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  message.role === 'assistant'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  message.role === 'assistant'
                    ? 'bg-muted text-foreground rounded-tr-sm'
                    : 'bg-primary text-primary-foreground rounded-tl-sm'
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tr-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          {isConversationComplete ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-center text-muted-foreground">
                מצוין! סיימנו לאסוף את כל המידע. אפשר להמשיך לשלב הבא.
              </p>
              <Button onClick={handleComplete} className="w-full">
                המשך לשלב הבא
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="הקלד את התשובה שלך..."
                className="min-h-[44px] max-h-32 resize-none"
                disabled={isLoading}
                dir="rtl"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="h-[44px] w-[44px] flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 rotate-180" />
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
