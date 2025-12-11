'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { QuestionnaireAnswers } from '@/types/onboarding';
import { useMemo } from 'react';

const FIXED_QUESTIONS = [
  {
    key: 'services' as keyof QuestionnaireAnswers,
    number: 1,
    question: 'מה השירותים שאתם מציעים?',
    placeholder: 'תאר את השירותים העיקריים שהעסק מציע...',
  },
  {
    key: 'advantages' as keyof QuestionnaireAnswers,
    number: 2,
    question: 'מה היתרונות המרכזיים שלכם?',
    placeholder: 'מה מייחד אתכם מהמתחרים, מה עושה אתכם מיוחדים...',
  },
  {
    key: 'tone' as keyof QuestionnaireAnswers,
    number: 3,
    question: 'מה הטון של המותג שלכם?',
    placeholder: 'מקצועי, ידידותי, צעיר, רשמי...',
  },
  {
    key: 'key_messages' as keyof QuestionnaireAnswers,
    number: 4,
    question: 'מהם המסרים המרכזיים שלכם?',
    placeholder: 'המסרים והערכים שחשוב להעביר ללקוחות...',
  },
  {
    key: 'additional_info' as keyof QuestionnaireAnswers,
    number: 5,
    question: 'מידע נוסף שחשוב לנו לדעת',
    placeholder: 'כל מידע רלוונטי נוסף שיכול לעזור לנו להכיר את העסק...',
  },
];

interface FixedQuestionnaireProps {
  answers: Partial<QuestionnaireAnswers>;
  onAnswerChange: (field: keyof QuestionnaireAnswers, value: string) => void;
  onNext: () => void;
}

export function FixedQuestionnaire({
  answers,
  onAnswerChange,
  onNext,
}: FixedQuestionnaireProps) {
  // Calculate progress
  const answeredCount = useMemo(() => {
    return FIXED_QUESTIONS.filter((q) => {
      const answer = answers[q.key];
      return answer && answer.trim().length > 0;
    }).length;
  }, [answers]);

  const canProceed = answeredCount >= 3;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Progress indicator */}
      <div className="text-center mb-8">
        <p className="text-lg font-medium text-muted-foreground">
          עניתם על {answeredCount} מתוך {FIXED_QUESTIONS.length} שאלות
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {canProceed
            ? 'מעולה! אפשר להמשיך'
            : 'נא לענות על לפחות 3 שאלות כדי להמשיך'}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {FIXED_QUESTIONS.map((question) => {
          const answer = answers[question.key] || '';
          const isAnswered = answer.trim().length > 0;

          return (
            <Card
              key={question.key}
              className={`transition-all ${
                isAnswered
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-start justify-between gap-4">
                  <span className="flex-1 text-lg">{question.question}</span>
                  <span className="flex-shrink-0 text-2xl font-bold text-primary">
                    {question.number}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={answer}
                  onChange={(e) => onAnswerChange(question.key, e.target.value)}
                  placeholder={question.placeholder}
                  className="min-h-[120px] resize-none text-right"
                  dir="rtl"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="min-w-[200px]"
        >
          {canProceed ? 'המשך לשלב הבא' : `נא לענות על לפחות ${3 - answeredCount} שאלות נוספות`}
        </Button>
      </div>
    </div>
  );
}
