import { NextRequest, NextResponse } from 'next/server';

/**
 * Conversational Onboarding API
 * Follows Agent B prompt structure with 3 screens:
 * Screen 1: Product/Services identification and selection
 * Screen 2: Customer mapping for each selected service
 * Screen 3: Category-specific questions (Q2-Q8)
 */

// Dummy data - business info
const DUMMY_BUSINESS = {
  name: 'החברה שלי',
  product: 'פתרונות שיווק דיגיטלי מתקדמים לעסקים קטנים ובינוניים',
  services: [
    'פיתוח אתרים',
    'ניהול מדיה חברתית',
    'קידום ממומן',
    'יצירת תוכן',
    'ייעוץ שיווקי',
  ],
};

// Category questions (Q2-Q8) - using Category 4: B2B Service as example
const CATEGORY_QUESTIONS = [
  {
    id: 'q2',
    question: 'מה קורה בעסק שגורם לבעלים להבין שהוא צריך מישהו כמוך?',
    clarification: 'מה הבעיה הספציפית שגורמת לאנשים להרים טלפון?',
  },
  {
    id: 'q3',
    question: 'מה היה קורה ללקוחות שלך אם הם היו ממשיכים בלי עזרה? מה הם היו מפסידים?',
    clarification: 'מה הדבר הכי גרוע שיכול לקרות לעסק שלא מטפל בזה?',
  },
  {
    id: 'q4',
    question: 'יש עוד הרבה אנשים שעושים מה שאתה עושה. למה שבעל עסק יבחר דווקא בך?',
    clarification: 'מה אתה עושה שאחרים בתחום לא עושים?',
  },
  {
    id: 'q5',
    question: 'מה אתה רואה שבעלי עסקים לא רואים? מה הטעות הכי יקרה שאתה מציל אותם ממנה?',
    clarification: 'מה הטעות הכי נפוצה שאתה רואה אצל עסקים שמגיעים אליך?',
  },
  {
    id: 'q6',
    question: 'כשלקוח ממליץ עליך לבעל עסק אחר - מה הוא אומר? באיזה מילים?',
    clarification: 'יש משפט ספציפי ששמעת מלקוח שממליץ עליך?',
  },
  {
    id: 'q7',
    question: 'ספר לי על לקוח אחד - מה היה המצב כשהגיע, מה עשית, ומה התוצאה?',
    clarification: 'מה היה האתגר הספציפי? ומה השתנה אחרי?',
  },
];

export async function POST(request: NextRequest) {
  try {
    const { messages, currentStage, sessionData } = await request.json();

    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    // Determine stage and response
    let response: any = {
      success: true,
      message: '',
      stage: currentStage,
      sessionData: sessionData || {},
    };

    // === SCREEN 1: Product/Services Selection ===
    if (currentStage === 'initial') {
      // First user message - has website?
      const hasWebsite = lastUserMessage.toLowerCase().includes('כן') ||
                        lastUserMessage.toLowerCase().includes('יש');

      if (hasWebsite) {
        // Simulate website scan - show services with selection UI
        response.message = `מעולה! אני סורק את האתר שלך...\n\nככה אני מבין את זה:\n**המוצר/עסק:** ${DUMMY_BUSINESS.product}\n\n**השירותים שזיהיתי:**\n\nבחר 1-3 שירותים שהכי חשוב לך לקדם בשיווק:`;
        response.services = DUMMY_BUSINESS.services;
        response.selectedServices = [];
        response.showServiceSelection = true;
        response.sessionData.hasWebsite = true;
        response.sessionData.awaitingServiceSelection = true;
      } else {
        // No website - ask for manual input
        response.message = 'בסדר גמור! ספר לי מה העסק עושה ומה השירותים/מוצרים שאתה מציע?';
        response.sessionData.hasWebsite = false;
        response.sessionData.awaitingManualInput = true;
      }

      response.stage = 'screen1';

    } else if (currentStage === 'screen1') {
      if (sessionData.awaitingConfirmation) {
        // User confirmed/corrected - now show service selection
        response.message = `מעולה. עכשיו אני צריך להבין על מה נתמקד בשיווק.\n\nבחר 1-3 שירותים שהכי חשוב לך לקדם:`;
        response.services = DUMMY_BUSINESS.services;
        response.selectedServices = [];
        response.sessionData.awaitingServiceSelection = true;
        delete response.sessionData.awaitingConfirmation;

      } else if (sessionData.awaitingManualInput) {
        // Parse manual input and show service selection immediately
        response.message = `אוקיי, אם אני מבין נכון:\n**המוצר/עסק:** ${DUMMY_BUSINESS.product}\n\n**השירותים שזיהיתי:**\n\nבחר 1-3 שירותים שהכי חשוב לך לקדם בשיווק:`;
        response.services = DUMMY_BUSINESS.services;
        response.selectedServices = [];
        response.showServiceSelection = true;
        response.sessionData.awaitingServiceSelection = true;
        delete response.sessionData.awaitingManualInput;

      } else if (sessionData.awaitingServiceSelection) {
        // User selected services
        const selectedServices = lastUserMessage.split(',').map((s: string) => s.trim());

        response.message = `אוקיי, אז מתמקדים ב:\n${selectedServices.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\nרק לוודא שהבנתי נכון את המוצר שלכם - ${DUMMY_BUSINESS.product}. מאשר?`;
        response.sessionData.selectedServices = selectedServices;
        response.sessionData.awaitingFinalConfirmation = true;
        delete response.sessionData.awaitingServiceSelection;

      } else if (sessionData.awaitingFinalConfirmation) {
        // Move to Screen 2 - show all services with input fields
        response.stage = 'screen2';
        response.message = `עכשיו אני רוצה להבין מי הלקוחות של כל שירות שבחרת.`;
        response.showCustomerMapping = true;
        response.servicesForMapping = sessionData.selectedServices;
        response.sessionData.awaitingCustomerMapping = true;
        delete response.sessionData.awaitingFinalConfirmation;
      }

    // === SCREEN 2: Customer Mapping ===
    } else if (currentStage === 'screen2') {
      if (sessionData.awaitingCustomerMapping) {
        // Parse format: service1:customers1|service2:customers2
        const mappings = lastUserMessage.split('|');
        const serviceCustomerPairs = mappings.map((mapping: string) => {
          const [service, customers] = mapping.split(':');
          return {
            service: service.trim(),
            customers: customers ? customers.split(',').map((c: string) => c.trim()) : [],
          };
        });

        // Show summary table
        response.message = `מעולה, אז ככה זה נראה:\n\nנכון?`;
        response.serviceCustomerPairs = serviceCustomerPairs;
        response.sessionData.serviceCustomerPairs = serviceCustomerPairs;
        response.sessionData.awaitingSummaryConfirmation = true;
        delete response.sessionData.awaitingCustomerMapping;
      } else if (sessionData.awaitingSummaryConfirmation) {
        // Move to Screen 3
        response.stage = 'screen3';
        response.sessionData.currentQuestionIndex = 0;
        response.sessionData.answers = {};
        delete response.sessionData.awaitingSummaryConfirmation;

        response.message = `אחלה. עכשיו יש לי כמה שאלות שיעזרו לי להבין לעומק מה מייחד אתכם. זה לוקח כ-5 דקות. מתחילים?\n\nשאלה ראשונה:\n${CATEGORY_QUESTIONS[0].question}`;
      }

    // === SCREEN 3: Category Questions ===
    } else if (currentStage === 'screen3') {
      const currentQuestionIndex = sessionData.currentQuestionIndex || 0;
      const answers = sessionData.answers || {};

      // Save current answer
      const currentQuestion = CATEGORY_QUESTIONS[currentQuestionIndex];
      answers[currentQuestion.id] = lastUserMessage;

      const nextQuestionIndex = currentQuestionIndex + 1;

      if (nextQuestionIndex < CATEGORY_QUESTIONS.length) {
        // More questions
        const nextQuestion = CATEGORY_QUESTIONS[nextQuestionIndex];
        response.message = nextQuestion.question;
        response.sessionData.currentQuestionIndex = nextQuestionIndex;
        response.sessionData.answers = answers;

      } else {
        // All questions answered - complete!
        response.message = `תודה רבה! יש לי תמונה טובה של העסק שלך.\n\nיש עוד משהו שחשוב לך שאדע?`;
        response.sessionData.awaitingAdditionalInfo = true;
        response.sessionData.answers = answers;
      }

    } else if (sessionData.awaitingAdditionalInfo) {
      // Final message
      response.message = `מעולה. המידע הזה יעזור לנו לבנות פרסום שבאמת מדבר ללקוחות שלך.\n\nמעביר אותך לשלב הבא...`;
      response.isComplete = true;
      response.finalData = {
        business: DUMMY_BUSINESS,
        selectedServices: sessionData.selectedServices,
        serviceCustomerPairs: sessionData.serviceCustomerPairs,
        answers: sessionData.answers,
        additionalInfo: lastUserMessage,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Conversational chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process chat',
      },
      { status: 500 }
    );
  }
}
