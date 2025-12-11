/**
 * ProgressBar Component
 * Shows wizard progress with step labels
 */

'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  return (
    <div className="mb-8">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <div key={index} className="flex items-center">
              {/* Step circle */}
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-1 mx-2 rounded transition-all',
                    currentStep > stepNumber ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels */}
      <div className="flex justify-center">
        <div className="flex gap-14">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCurrent = currentStep === stepNumber;

            return (
              <span
                key={index}
                className={cn(
                  'text-sm transition-all text-center w-20',
                  isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {step}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
