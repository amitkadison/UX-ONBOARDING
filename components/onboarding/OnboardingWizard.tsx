'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProgressBar } from './ProgressBar';
import { PathSelection } from './PathSelection';
import { WebsiteScan } from './WebsiteScan';
import { ChatQuestionnaire } from './ChatQuestionnaire';
import { FixedQuestionnaire } from './FixedQuestionnaire';
import { CompetitorUrls } from './CompetitorUrls';
import Summary from './Summary';
import { CompetitionPrompt } from '../ads-research/CompetitionPrompt';
import {
  WizardState,
  WizardPath,
  OnboardingData,
  DynamicQuestion,
  UrlValidationResult,
  initialWizardState,
  QuestionnaireAnswers,
} from '@/types/onboarding';
import { safeToonEncodeString } from '@/lib/toon-utils';

interface ScanWebsiteResponse {
  success: boolean;
  data?: {
    url: string;
    raw_title: string;
    raw_content: string;
    company_name?: string;
    industry?: string;
    mission?: string;
    products_services?: string[];
    target_audience?: string;
    unique_value_proposition?: string;
    brand_voice?: string;
    key_messaging?: string[];
    visual_elements?: {
      colors: string[];
      has_logo: boolean;
    };
    gaps?: string[];
  };
  error?: string;
}

interface GenerateQuestionsResponse {
  success: boolean;
  questions?: DynamicQuestion[];
  error?: string;
}

interface ValidateUrlsResponse {
  success: boolean;
  results?: UrlValidationResult[];
  summary?: {
    valid: string[];
    invalid: { url: string; error?: string }[];
  };
  error?: string;
}

interface SaveProfileResponse {
  success: boolean;
  profile?: {
    id: string;
    company_name: string;
    onboarding_completed: boolean;
  };
  error?: string;
}

interface OnboardingWizardProps {
  /** Where to redirect after completion. Defaults to '/' */
  redirectPath?: string;
  /** Callback fired after successful save. If provided, redirectPath is ignored. */
  onComplete?: () => void;
  /** Admin mode - skips user-specific checks */
  isAdminMode?: boolean;
}

export function OnboardingWizard({
  redirectPath = '/',
  onComplete,
  isAdminMode = false
}: OnboardingWizardProps = {}) {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [isLoading, setIsLoading] = useState({
    scanning: false,
    generatingQuestions: false,
    validatingUrls: false,
    submitting: false,
  });

  // Additional state for component interfaces
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [urlValidationResults, setUrlValidationResults] = useState<UrlValidationResult[]>([]);

  // Competition prompt state
  const [showCompetitionPrompt, setShowCompetitionPrompt] = useState(false);

  // Step definitions based on path
  const getSteps = useCallback((): string[] => {
    if (state.path === 'has-website') {
      return ['בחירת נתיב', 'סריקת אתר', 'שאלון השלמה', 'מתחרים', 'סיכום'];
    } else if (state.path === 'no-website') {
      return ['בחירת נתיב', 'שאלון', 'מתחרים', 'סיכום'];
    }
    return ['בחירת נתיב'];
  }, [state.path]);

  // API call: Validate competitor URLs
  const handleValidateUrls = useCallback(async (): Promise<void> => {
    const nonEmptyUrls = competitorUrls.filter(url => url.trim() !== '');
    if (nonEmptyUrls.length === 0) {
      return;
    }

    setIsLoading(prev => ({ ...prev, validatingUrls: true }));

    try {
      const response = await fetch('/api/onboarding/validate-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: safeToonEncodeString({ urls: nonEmptyUrls }),
      });

      const result: ValidateUrlsResponse = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'שגיאה באימות כתובות');
        return;
      }

      setUrlValidationResults(result.results || []);

      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          competitors: {
            urls_valid: result.summary?.valid || [],
            urls_invalid: result.summary?.invalid?.map(i => i.url) || [],
          },
        },
      }));

      const validCount = result.summary?.valid?.length || 0;
      const invalidCount = result.summary?.invalid?.length || 0;

      if (invalidCount > 0) {
        toast.warning(`${validCount} כתובות תקינות, ${invalidCount} לא תקינות`);
      } else if (validCount > 0) {
        toast.success('כל הכתובות תקינות');
      }
    } catch (error) {
      console.error('[OnboardingWizard] Validate URLs error:', error);
      toast.error('שגיאה באימות כתובות');
    } finally {
      setIsLoading(prev => ({ ...prev, validatingUrls: false }));
    }
  }, [competitorUrls]);

  // API call: Save profile to database
  const handleSaveProfile = useCallback(async (): Promise<boolean> => {
    setIsLoading(prev => ({ ...prev, submitting: true }));

    try {
      const response = await fetch('/api/onboarding/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: safeToonEncodeString({
          source: state.data.source,
          site_url: state.data.site_url,
          company_name: state.data.company_name,
          industry: state.data.industry,
          mission: state.data.mission,
          products_services: state.data.products_services,
          target_audience: state.data.target_audience,
          unique_value_proposition: state.data.unique_value_proposition,
          brand_voice: state.data.brand_voice,
          key_messaging: state.data.key_messaging,
          questionnaire_answers: state.data.questionnaire_answers,
          dynamic_questionnaire: state.data.dynamic_questionnaire,
          competitors_valid: state.data.competitors.urls_valid,
          competitors_invalid: state.data.competitors.urls_invalid,
          onboarding_completed: true,
        }),
      });

      const result: SaveProfileResponse = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'שגיאה בשמירת הפרופיל');
        return false;
      }

      toast.success('הפרופיל נשמר בהצלחה!');
      return true;
    } catch (error) {
      console.error('[OnboardingWizard] Save profile error:', error);
      toast.error('שגיאה בשמירת הפרופיל');
      return false;
    } finally {
      setIsLoading(prev => ({ ...prev, submitting: false }));
    }
  }, [state.data]);

  // Navigation: Path selection
  const handlePathSelect = useCallback((path: WizardPath) => {
    setState(prev => ({
      ...prev,
      path,
      currentStep: 1,
      data: {
        ...prev.data,
        source: path === 'has-website' ? 'website' : 'questionnaire',
      },
    }));
  }, []);

  // Navigation: Next step
  const handleNext = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
  }, []);

  // Navigation: Previous step
  const handleBack = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  }, [state.currentStep]);

  // Navigation: Start over
  const handleStartOver = useCallback(() => {
    setState(initialWizardState);
    setQuestionnaireAnswers({});
    setCompetitorUrls(['']);
    setUrlValidationResults([]);
  }, []);

  // WebsiteScan: Handle data change
  const handleWebsiteDataChange = useCallback((newData: OnboardingData) => {
    setState(prev => ({
      ...prev,
      data: newData,
    }));
  }, []);

  // ConversationalQuestionnaire: Handle complete (merge all answers into state)
  const handleConversationalComplete = useCallback((answers: Record<string, string>) => {
    // Merge answers into the dynamic questions
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        dynamic_questionnaire: prev.data.dynamic_questionnaire.map(q => ({
          ...q,
          answer: answers[q.field] || q.answer,
        })),
      },
    }));
    handleNext();
  }, [handleNext]);

  // FixedQuestionnaire: Handle answer change
  const handleQuestionnaireAnswerChange = useCallback((field: keyof QuestionnaireAnswers, value: string) => {
    setQuestionnaireAnswers(prev => ({ ...prev, [field]: value }));
  }, []);

  // FixedQuestionnaire: Handle next (transform answers to structured data)
  const handleFixedQuestionnaireNext = useCallback(() => {
    const answers = questionnaireAnswers as QuestionnaireAnswers;
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        questionnaire_answers: answers,
        company_name: extractCompanyName(answers),
        industry: extractIndustry(answers),
        mission: answers.additional_info || '',
        products_services: extractProducts(answers.services || ''),
        target_audience: extractTargetAudience(answers),
        unique_value_proposition: answers.advantages || '',
        brand_voice: answers.tone || '',
        key_messaging: extractKeyMessages(answers.key_messages || ''),
      },
    }));
    handleNext();
  }, [questionnaireAnswers, handleNext]);

  // CompetitorUrls: Handlers
  const handleUrlChange = useCallback((index: number, value: string) => {
    setCompetitorUrls(prev => {
      const newUrls = [...prev];
      newUrls[index] = value;
      return newUrls;
    });
    // Reset validation results when URLs change
    setUrlValidationResults([]);
  }, []);

  const handleAddUrl = useCallback(() => {
    if (competitorUrls.length < 5) {
      setCompetitorUrls(prev => [...prev, '']);
    }
  }, [competitorUrls.length]);

  const handleRemoveUrl = useCallback((index: number) => {
    setCompetitorUrls(prev => prev.filter((_, i) => i !== index));
    setUrlValidationResults([]);
  }, []);

  // CompetitorUrls: Handle next
  const handleCompetitorUrlsNext = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Summary: Handle data change
  const handleSummaryDataChange = useCallback((field: string, value: any) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  }, []);

  // Summary: Handle complete
  const handleSummaryComplete = useCallback(async () => {
    const success = await handleSaveProfile();
    if (success) {
      // Show competition prompt instead of immediately navigating
      setShowCompetitionPrompt(true);
    }
  }, [handleSaveProfile]);

  // Competition prompt: Skip to dashboard
  const handleSkipCompetition = useCallback(() => {
    setShowCompetitionPrompt(false);
    if (onComplete) {
      onComplete();
    } else {
      router.push(redirectPath);
    }
  }, [router, redirectPath, onComplete]);

  // Competition prompt: Continue to ads research
  const handleContinueToResearch = useCallback(() => {
    setShowCompetitionPrompt(false);
    const services = state.data.products_services.join(',');
    const companyName = encodeURIComponent(state.data.company_name || '');
    router.push(`/ads-research?services=${encodeURIComponent(services)}&companyName=${companyName}`);
  }, [router, state.data.products_services, state.data.company_name]);

  // Render current step
  const renderStep = () => {
    if (state.currentStep === 0) {
      return <PathSelection onSelectPath={handlePathSelect} />;
    }

    if (state.path === 'has-website') {
      // Website path steps
      switch (state.currentStep) {
        case 1:
          return (
            <WebsiteScan
              data={state.data}
              onDataChange={handleWebsiteDataChange}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 2:
          return (
            <ChatQuestionnaire
              onComplete={handleConversationalComplete}
              businessContext={{
                companyName: state.data.company_name,
                industry: state.data.industry,
                services: state.data.products_services,
              }}
            />
          );
        case 3:
          return (
            <CompetitorUrls
              urls={competitorUrls}
              validationResults={urlValidationResults}
              onUrlChange={handleUrlChange}
              onAddUrl={handleAddUrl}
              onRemoveUrl={handleRemoveUrl}
              onValidate={handleValidateUrls}
              onNext={handleCompetitorUrlsNext}
              isValidating={isLoading.validatingUrls}
            />
          );
        case 4:
          return (
            <Summary
              data={{
                source: state.data.source || 'website',
                siteUrl: state.data.site_url || undefined,
                companyName: state.data.company_name,
                industry: state.data.industry || undefined,
                mission: state.data.mission || undefined,
                productsServices: state.data.products_services,
                targetAudience: state.data.target_audience || undefined,
                uniqueValueProposition: state.data.unique_value_proposition || undefined,
                brandVoice: state.data.brand_voice || undefined,
                keyMessaging: state.data.key_messaging,
                competitorsValid: state.data.competitors.urls_valid,
                competitorsInvalid: state.data.competitors.urls_invalid,
                questionnaireAnswers: (state.data.questionnaire_answers ?? undefined) as Record<string, string> | undefined,
                // Visual branding
                logoUrl: state.data.logo_url || undefined,
                brandColors: state.data.brand_colors || undefined,
                brandFonts: state.data.brand_fonts || undefined,
              }}
              onDataChange={handleSummaryDataChange}
              onStartOver={handleStartOver}
              onComplete={handleSummaryComplete}
              isSubmitting={isLoading.submitting}
            />
          );
        default:
          return null;
      }
    } else if (state.path === 'no-website') {
      // Questionnaire path steps
      switch (state.currentStep) {
        case 1:
          return (
            <FixedQuestionnaire
              answers={questionnaireAnswers}
              onAnswerChange={handleQuestionnaireAnswerChange}
              onNext={handleFixedQuestionnaireNext}
            />
          );
        case 2:
          return (
            <CompetitorUrls
              urls={competitorUrls}
              validationResults={urlValidationResults}
              onUrlChange={handleUrlChange}
              onAddUrl={handleAddUrl}
              onRemoveUrl={handleRemoveUrl}
              onValidate={handleValidateUrls}
              onNext={handleCompetitorUrlsNext}
              isValidating={isLoading.validatingUrls}
            />
          );
        case 3:
          return (
            <Summary
              data={{
                source: state.data.source || 'questionnaire',
                siteUrl: state.data.site_url || undefined,
                companyName: state.data.company_name,
                industry: state.data.industry || undefined,
                mission: state.data.mission || undefined,
                productsServices: state.data.products_services,
                targetAudience: state.data.target_audience || undefined,
                uniqueValueProposition: state.data.unique_value_proposition || undefined,
                brandVoice: state.data.brand_voice || undefined,
                keyMessaging: state.data.key_messaging,
                competitorsValid: state.data.competitors.urls_valid,
                competitorsInvalid: state.data.competitors.urls_invalid,
                questionnaireAnswers: (state.data.questionnaire_answers ?? undefined) as Record<string, string> | undefined,
                // Visual branding (usually empty for questionnaire path)
                logoUrl: state.data.logo_url || undefined,
                brandColors: state.data.brand_colors || undefined,
                brandFonts: state.data.brand_fonts || undefined,
              }}
              onDataChange={handleSummaryDataChange}
              onStartOver={handleStartOver}
              onComplete={handleSummaryComplete}
              isSubmitting={isLoading.submitting}
            />
          );
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <>
      <div dir="rtl" className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">התאמה אישית לעסק שלך</h1>
          <p className="text-center text-muted-foreground">
            ספר לנו על העסק שלך כדי שנוכל ליצור תוכן מותאם במיוחד עבורך
          </p>
        </div>

        <ProgressBar steps={getSteps()} currentStep={state.currentStep} totalSteps={getSteps().length} />

        <div className="mt-8">{renderStep()}</div>
      </div>

      <CompetitionPrompt
        isOpen={showCompetitionPrompt}
        onSkip={handleSkipCompetition}
        onContinue={handleContinueToResearch}
      />
    </>
  );
}

// Helper functions to transform questionnaire answers into structured data

function extractCompanyName(answers: QuestionnaireAnswers): string {
  // Try to extract company name from services or additional info
  const servicesWords = (answers.services || '').split(' ');
  return servicesWords[0] || 'החברה שלי';
}

function extractIndustry(answers: QuestionnaireAnswers): string {
  const services = (answers.services || '').toLowerCase();
  if (services.includes('טכנולוגיה') || services.includes('תוכנה')) return 'טכנולוגיה';
  if (services.includes('שיווק') || services.includes('פרסום')) return 'שיווק ופרסום';
  if (services.includes('ייעוץ')) return 'ייעוץ';
  if (services.includes('אופנה') || services.includes('בגדים')) return 'אופנה';
  if (services.includes('מזון') || services.includes('מסעדה')) return 'מזון ומסעדנות';
  return 'כללי';
}

function extractProducts(servicesText: string): string[] {
  return servicesText
    .split(/[,،\/\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 10);
}

function extractTargetAudience(answers: QuestionnaireAnswers): string {
  const tone = answers.tone || '';
  if (tone.includes('מקצועי') || tone.includes('עסקי')) {
    return 'עסקים וארגונים';
  }
  if (tone.includes('צעיר') || tone.includes('דינמי')) {
    return 'קהל צעיר ודינמי';
  }
  return 'קהל רחב';
}

function extractKeyMessages(messagesText: string): string[] {
  return messagesText
    .split(/[,،\/\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 5);
}
