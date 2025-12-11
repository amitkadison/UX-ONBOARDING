/**
 * CompetitorUrls Component
 * Allows users to input and validate competitor URLs
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { UrlValidationResult } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface CompetitorUrlsProps {
  urls: string[];
  validationResults: UrlValidationResult[];
  onUrlChange: (index: number, value: string) => void;
  onAddUrl: () => void;
  onRemoveUrl: (index: number) => void;
  onValidate: () => void;
  onNext: () => void;
  isValidating: boolean;
}

export function CompetitorUrls({
  urls,
  validationResults,
  onUrlChange,
  onAddUrl,
  onRemoveUrl,
  onValidate,
  onNext,
  isValidating,
}: CompetitorUrlsProps) {
  const MAX_COMPETITORS = 5;
  const canAddMore = urls.length < MAX_COMPETITORS;

  // Check if we have any validated URLs
  const hasValidatedUrls = validationResults.length > 0;
  const validUrlsCount = validationResults.filter(r => r.valid).length;
  const hasValidUrls = validUrlsCount > 0;

  // Check if all filled URLs have been validated
  const filledUrls = urls.filter(url => url.trim() !== '');
  const allFilledUrlsValidated = filledUrls.length > 0 &&
    filledUrls.every(url =>
      validationResults.some(r => r.url === url)
    );

  // Can proceed if either: (1) has valid URLs, or (2) chose to skip (no URLs entered or all invalid)
  const canProceed = allFilledUrlsValidated && (hasValidUrls || filledUrls.length === 0);

  // Get validation result for a specific URL
  const getValidationResult = (url: string): UrlValidationResult | undefined => {
    return validationResults.find(r => r.url === url);
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">מתחרים (אופציונלי)</h2>
        <p className="text-muted-foreground">
          הוסף עד {MAX_COMPETITORS} כתובות אתרים של מתחרים לניתוח
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          ניתן לדלג על שלב זה אם אין מתחרים ידועים
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8 space-y-4">
        {urls.map((url, index) => {
          const validationResult = getValidationResult(url);
          const showValidation = validationResult && url.trim() !== '';

          return (
            <div key={index} className="relative">
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder="https://competitor.com"
                      value={url}
                      onChange={(e) => onUrlChange(index, e.target.value)}
                      className={cn(
                        "text-left pr-12",
                        showValidation && validationResult.valid && "border-green-500 focus-visible:ring-green-500",
                        showValidation && !validationResult.valid && "border-destructive focus-visible:ring-destructive"
                      )}
                      dir="ltr"
                      disabled={isValidating}
                    />
                    {/* Validation status icon */}
                    {showValidation && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        {validationResult.valid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                  {/* Validation error message */}
                  {showValidation && !validationResult.valid && validationResult.error && (
                    <div className="flex items-start gap-1 mt-1 text-destructive text-xs">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{validationResult.error}</span>
                    </div>
                  )}
                </div>

                {/* Remove button - only show if not the first input */}
                {index > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onRemoveUrl(index)}
                    disabled={isValidating}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add competitor button */}
        {canAddMore && (
          <Button
            variant="outline"
            onClick={onAddUrl}
            disabled={isValidating}
            className="w-full"
          >
            <Plus className="w-4 h-4 ml-2" />
            הוסף מתחרה ({urls.length}/{MAX_COMPETITORS})
          </Button>
        )}

        {/* Validate button */}
        {filledUrls.length > 0 && (
          <Button
            onClick={onValidate}
            disabled={isValidating || allFilledUrlsValidated}
            className="w-full"
            variant="secondary"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                בודק תקינות...
              </>
            ) : allFilledUrlsValidated ? (
              <>
                <CheckCircle2 className="w-4 h-4 ml-2" />
                בדיקה הושלמה
              </>
            ) : (
              'בדוק תקינות'
            )}
          </Button>
        )}
      </div>

      {/* Validation summary */}
      {hasValidatedUrls && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className={cn(
            "rounded-lg border p-4 text-center",
            hasValidUrls
              ? "bg-green-500/10 border-green-500/20"
              : "bg-amber-500/10 border-amber-500/20"
          )}>
            <p className={cn(
              "font-medium",
              hasValidUrls
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            )}>
              {hasValidUrls
                ? `נמצאו ${validUrlsCount} כתובות תקינות`
                : 'לא נמצאו כתובות תקינות'
              }
            </p>
            {!hasValidUrls && (
              <p className="text-sm text-muted-foreground mt-1">
                ניתן להמשיך ללא מתחרים או לתקן את הכתובות
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-center gap-3 mt-8 max-w-2xl mx-auto">
        {/* Skip button - show if no URLs or if validation failed */}
        {(!hasValidUrls || filledUrls.length === 0) && (
          <Button
            variant="outline"
            onClick={onNext}
            disabled={isValidating}
          >
            דלג
          </Button>
        )}

        {/* Next button - show if has valid URLs */}
        {hasValidUrls && (
          <Button
            onClick={onNext}
            disabled={!canProceed || isValidating}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            המשך עם {validUrlsCount} {validUrlsCount === 1 ? 'מתחרה' : 'מתחרים'}
          </Button>
        )}
      </div>

      {/* Helper text */}
      <div className="text-center mt-4">
        <p className="text-xs text-muted-foreground">
          {!allFilledUrlsValidated && filledUrls.length > 0
            ? 'יש לבדוק תקינות לפני המשך'
            : hasValidUrls
            ? 'המתחרים שנבחרו ישמשו לניתוח והשוואה'
            : filledUrls.length > 0
            ? 'ניתן לתקן את הכתובות או לדלג'
            : 'ניתן לדלג על שלב זה ולהמשיך ללא מתחרים'
          }
        </p>
      </div>
    </div>
  );
}
