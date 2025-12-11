/**
 * Onboarding Wizard Types
 */

export type WizardPath = 'has-website' | 'no-website' | null;

export interface WizardState {
  path: WizardPath;
  currentStep: number;
  data: OnboardingData;
}

export interface OnboardingData {
  // Source
  source: 'website' | 'questionnaire' | null;
  site_url: string | null;

  // Scraped/extracted data
  company_name: string;
  industry: string;
  mission: string;
  products_services: string[];
  target_audience: string;
  unique_value_proposition: string;
  brand_voice: string;
  key_messaging: string[];

  // Visual elements (from scraping)
  visual_elements?: {
    colors: string[];
    has_logo: boolean;
  };

  // Logo URL extracted from website
  logo_url?: string;

  // Favicon URL extracted from website
  favicon_url?: string;

  // Brand colors extracted from website CSS
  brand_colors?: string[];

  // Font families used on the website
  brand_fonts?: string[];

  // Questionnaire answers (no-website path)
  questionnaire_answers: QuestionnaireAnswers | null;

  // Dynamic questions (website path)
  dynamic_questionnaire: DynamicQuestion[];

  // Competitors
  competitors: CompetitorsData;
}

export interface QuestionnaireAnswers {
  services: string;
  advantages: string;
  tone: string;
  key_messages: string;
  additional_info: string;
}

export interface DynamicQuestion {
  field: string;
  description: string;
  question_for_client: string;
  answer?: string;
}

export interface CompetitorsData {
  urls_valid: string[];
  urls_invalid: string[];
}

export interface UrlValidationResult {
  url: string;
  valid: boolean;
  error?: string;
}

// Initial state
export const initialOnboardingData: OnboardingData = {
  source: null,
  site_url: null,
  company_name: '',
  industry: '',
  mission: '',
  products_services: [],
  target_audience: '',
  unique_value_proposition: '',
  brand_voice: '',
  key_messaging: [],
  questionnaire_answers: null,
  dynamic_questionnaire: [],
  competitors: {
    urls_valid: [],
    urls_invalid: [],
  },
};

export const initialWizardState: WizardState = {
  path: null,
  currentStep: 0,
  data: initialOnboardingData,
};

// Fixed questions for no-website path
export const fixedQuestions = [
  {
    id: 'services',
    question: 'אנא פרט את כל השירותים שאתם מציעים',
  },
  {
    id: 'advantages',
    question: 'מהם היתרונות המרכזיים של העסק שלכם',
  },
  {
    id: 'tone',
    question: 'איך הייתם מתארים את הטון של המותג שלכם',
  },
  {
    id: 'key_messages',
    question: 'מהם המסרים או הערכים שאתם רוצים שהלקוחות יבינו מיד',
  },
  {
    id: 'additional_info',
    question: 'ישנם פרטים נוספים שחשוב שנדע על העסק שלכם?',
  },
];
