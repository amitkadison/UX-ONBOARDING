/**
 * ConversationalQuestionnaire Component
 * Simple input-first interface with optional AI clarification
 * Users answer directly, can optionally consult AI for help/clarification
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, ChevronLeft, Loader2, MessageCircle, X } from 'lucide-react';
import { DynamicQuestion } from '@/types/onboarding';
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

interface ConversationalQuestionnaireProps {
  questions: DynamicQuestion[];
  onComplete: (answers: Record<string, string>) => void;
  businessContext?: {
    companyName?: string;
    industry?: string;
    services?: string[];
  };
}

export function ConversationalQuestionnaire({
  questions,
  onComplete,
  businessContext,
}: ConversationalQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedServices, setSelectedServices] = useState<string[]>(
    businessContext?.services || []
  );
  const [allServices, setAllServices] = useState<string[]>(
    businessContext?.services || []
  );

  // AI Chat state
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Check if current question is the Priority_Selection (first question)
  const isPrioritySelectionQuestion = currentQuestion?.field === 'Priority_Selection';

  // Focus input on mount and question change
  useEffect(() => {
    if (!isPrioritySelectionQuestion) {
      inputRef.current?.focus();
    }
  }, [currentQuestionIndex, isPrioritySelectionQuestion]);

  // Auto-scroll chat messages
  useEffect(() => {
    if (showAiChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showAiChat]);

  // Focus chat input when opening AI chat
  useEffect(() => {
    if (showAiChat && !isLoading) {
      chatInputRef.current?.focus();
    }
  }, [showAiChat, isLoading]);

  // Handle no questions case
  if (!questions || questions.length === 0) {
    return (
      <div className="animate-fade-in" dir="rtl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            מצוין! אספנו את כל המידע
          </h2>
          <p className="text-muted-foreground">
            הצלחנו לאסוף מספיק מידע מהאתר שלך. נמשיך לשלב הבא.
          </p>
        </div>
        <div className="flex justify-center pt-4">
          <Button onClick={() => onComplete({})} size="lg">
            המשך לשלב הבא
          </Button>
        </div>
      </div>
    );
  }

  // Initialize AI chat with context
  const openAiChat = () => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: 'assistant',
          content: `שלום! אני כאן לעזור לך עם השאלה: "${currentQuestion.question_for_client}"\n\nאיך אוכל לעזור? אפשר לשאול אותי להבהיר את השאלה, לתת דוגמאות, או לעזור לך לנסח את התשובה.`,
        },
      ]);
    }
    setShowAiChat(true);
  };

  const closeAiChat = () => {
    setShowAiChat(false);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { body, contentType } = safeToonEncode({
        questionId: currentQuestion.field,
        questionText: currentQuestion.question_for_client,
        questionField: currentQuestion.field,
        messages: [...chatMessages, { role: 'user', content: userMessage }],
        businessContext,
      });
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      });

      const data = await response.json();
      console.log('[Chat] Response:', data);

      if (data.success && data.message) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message },
        ]);
      } else {
        console.error('[Chat] API error:', data.error || 'Unknown error');
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `סליחה, יש בעיה טכנית. ${data.error ? `(${data.error})` : ''} אפשר לנסות שוב?` },
        ]);
      }
    } catch (error) {
      console.error('[Chat] Network error:', error);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'סליחה, בעיית תקשורת. אפשר לנסות שוב?' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    // For Priority_Selection, use selected services as the answer
    let answerValue: string;
    if (isPrioritySelectionQuestion) {
      answerValue = selectedServices.join(', ');
    } else {
      answerValue = inputValue.trim();
    }

    // Save the answer for this question
    const updatedAnswers = {
      ...answers,
      [currentQuestion.field]: answerValue,
    };
    setAnswers(updatedAnswers);

    if (isLastQuestion) {
      onComplete(updatedAnswers);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setInputValue('');
      // Reset AI chat for next question
      setChatMessages([]);
      setShowAiChat(false);
    }
  };

  const handleSkipQuestion = () => {
    // Save empty answer and move to next
    const updatedAnswers = {
      ...answers,
      [currentQuestion.field]: '',
    };
    setAnswers(updatedAnswers);

    if (isLastQuestion) {
      onComplete(updatedAnswers);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setInputValue('');
      setChatMessages([]);
      setShowAiChat(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNextQuestion();
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  // Check if can proceed (has answer or is skippable)
  const canProceed = isPrioritySelectionQuestion
    ? selectedServices.length > 0
    : inputValue.trim().length > 0;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto" dir="rtl">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            שאלה {currentQuestionIndex + 1} מתוך {questions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Card */}
      <Card className="p-6">
        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {currentQuestion.question_for_client}
          </h3>
          {currentQuestion.description && (
            <p className="text-sm text-muted-foreground">
              {currentQuestion.description}
            </p>
          )}
        </div>

        {/* Service Selector for Priority_Selection question */}
        {isPrioritySelectionQuestion && allServices.length > 0 ? (
          <div className="space-y-4">
            <ServiceSelector
              services={allServices}
              selectedServices={selectedServices}
              onSelectionChange={setSelectedServices}
              onServicesChange={setAllServices}
            />

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedServices.length > 0
                  ? `נבחרו ${selectedServices.length} שירותים`
                  : 'בחר לפחות שירות אחד'}
              </span>
              <Button
                onClick={handleNextQuestion}
                disabled={selectedServices.length === 0}
                className="gap-2"
              >
                {isLastQuestion ? 'סיום' : 'לשאלה הבאה'}
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Simple Text Input */}
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הקלד את התשובה שלך כאן..."
              className="min-h-[100px] resize-none"
              dir="rtl"
            />

            {/* AI Chat Toggle Button */}
            <button
              onClick={openAiChat}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>צריך הבהרה? שוחח עם היועץ</span>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={handleSkipQuestion}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                דלג על שאלה זו
              </button>
              <Button
                onClick={handleNextQuestion}
                disabled={!canProceed}
                className="gap-2"
              >
                {isLastQuestion ? 'סיום' : 'לשאלה הבאה'}
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* AI Chat Modal/Overlay */}
      {showAiChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg h-[500px] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">יועץ השיווק</span>
              </div>
              <button
                onClick={closeAiChat}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message, index) => (
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
                      'max-w-[80%] rounded-2xl px-4 py-2',
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

            {/* Chat Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="שאל את היועץ..."
                  className="min-h-[44px] max-h-24 resize-none"
                  disabled={isLoading}
                  dir="rtl"
                />
                <Button
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim() || isLoading}
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

              {/* Use suggestion button */}
              {chatMessages.length > 1 && (
                <button
                  onClick={closeAiChat}
                  className="mt-3 w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  סיימתי, חזרה לתשובה שלי
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
