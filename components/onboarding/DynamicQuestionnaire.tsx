/**
 * DynamicQuestionnaire Component
 * Shows AI-generated questions based on gaps in scraped website data
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { DynamicQuestion } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface DynamicQuestionnaireProps {
  questions: DynamicQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (field: string, value: string) => void;
  onNext: () => void;
}

export function DynamicQuestionnaire({
  questions,
  answers,
  onAnswerChange,
  onNext,
}: DynamicQuestionnaireProps) {
  // Check if at least one answer is provided
  const hasAnswers = Object.values(answers).some((answer) => answer.trim().length > 0);

  // Get icon based on question field
  const getQuestionIcon = (field: string) => {
    // Use AlertCircle for critical fields, HelpCircle for optional info
    const criticalFields = ['mission', 'unique_value_proposition', 'target_audience'];
    return criticalFields.includes(field) ? AlertCircle : HelpCircle;
  };

  // Handle case with no questions
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
          <Button
            onClick={onNext}
            size="lg"
            className="min-w-48 shadow-lg hover:shadow-xl"
          >
            המשך לשלב הבא
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          עוד כמה פרטים חשובים
        </h2>
        <p className="text-muted-foreground">
          מצאנו מידע באתר, אבל נשמח לכמה הבהרות נוספות
        </p>
      </div>

      <div className="space-y-6 max-w-3xl mx-auto">
        {questions.map((question) => {
          const Icon = getQuestionIcon(question.field);
          const answer = answers[question.field] || '';

          return (
            <Card
              key={question.field}
              className={cn(
                'transition-all',
                answer.trim().length > 0 && 'border-primary/50 shadow-sm'
              )}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {question.question_for_client}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {question.description}
                    </CardDescription>
                  </div>
                  <div
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      answer.trim().length > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={answer}
                  onChange={(e) => onAnswerChange(question.field, e.target.value)}
                  placeholder="הקלידו את התשובה כאן..."
                  className={cn(
                    'w-full min-h-24 resize-y transition-all',
                    'focus:ring-2 focus:ring-primary/20'
                  )}
                  dir="rtl"
                />
              </CardContent>
            </Card>
          );
        })}

        {/* Save and Continue Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onNext}
            disabled={!hasAnswers}
            size="lg"
            className={cn(
              'min-w-48 transition-all',
              hasAnswers && 'shadow-lg hover:shadow-xl'
            )}
          >
            שמור והמשך
          </Button>
        </div>

        {/* Helper text */}
        {!hasAnswers && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            נא למלא לפחות תשובה אחת כדי להמשיך
          </p>
        )}
      </div>
    </div>
  );
}
