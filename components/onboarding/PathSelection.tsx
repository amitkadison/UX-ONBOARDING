/**
 * PathSelection Component
 * Initial choice: has website or no website
 */

'use client';

import { Globe, FileQuestion } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WizardPath } from '@/types/onboarding';

interface PathSelectionProps {
  onSelectPath: (path: WizardPath) => void;
}

export function PathSelection({ onSelectPath }: PathSelectionProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          ברוכים הבאים! בואו נכיר את העסק שלכם
        </h2>
        <p className="text-muted-foreground">
          בחרו את האפשרות המתאימה לכם כדי שנוכל להתאים את התוכן בצורה הטובה ביותר
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Has Website Option */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg hover:border-primary/50',
            'group'
          )}
          onClick={() => onSelectPath('has-website')}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              יש לי אתר
            </h3>
            <p className="text-muted-foreground text-sm">
              נסרוק את האתר שלכם ונחלץ מידע אוטומטית
            </p>
          </CardContent>
        </Card>

        {/* No Website Option */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg hover:border-primary/50',
            'group'
          )}
          onClick={() => onSelectPath('no-website')}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all">
              <FileQuestion className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              אין לי אתר
            </h3>
            <p className="text-muted-foreground text-sm">
              נשאל אתכם כמה שאלות קצרות על העסק
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
