'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Target, ArrowLeft } from 'lucide-react';

interface CompetitionPromptProps {
  isOpen: boolean;
  onSkip: () => void;
  onContinue: () => void;
}

export function CompetitionPrompt({
  isOpen,
  onSkip,
  onContinue,
}: CompetitionPromptProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            רוצה לחקור מודעות של מתחרים?
          </DialogTitle>
          <DialogDescription className="text-base">
            נוכל לנתח מודעות מהתחרות ולהפיק תובנות שיעזרו לך ליצור תוכן טוב יותר
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-center gap-2 mt-4">
          <Button variant="outline" onClick={onSkip}>
            דלג לדשבורד
          </Button>
          <Button onClick={onContinue} className="gap-2">
            כן, בוא נחקור!
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
