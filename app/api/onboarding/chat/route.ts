import { NextRequest, NextResponse } from 'next/server';

// Dummy conversation flow - simulates a natural chat experience
const conversationFlow = [
  {
    trigger: 'initial',
    response: 'שלום! אני כאן כדי להכיר את העסק שלך. ראיתי שבחרת כמה שירותים מעניינים. ספר לי, מה הופך את העסק שלך למיוחד? מה היתרון שלך על פני המתחרים?',
  },
  {
    trigger: 'first_answer',
    response: 'מעולה! זה נשמע ממש טוב. עכשיו בואו נדבר על קהל היעד - למי בעיקר מיועדים השירותים שלך? מי הם הלקוחות האידיאליים?',
  },
  {
    trigger: 'second_answer',
    response: 'מצוין! אני מתחיל להבין את התמונה. שאלה אחרונה - איך תרצה שהמותג שלך ישמע? מה הטון והסגנון שמתאים לך? (לדוגמה: מקצועי, ידידותי, צעיר ודינמי, רציני וכו\')',
  },
  {
    trigger: 'third_answer',
    response: 'תודה רבה! קיבלתי תמונה ברורה על העסק שלך. יש לי את כל המידע שאני צריך כדי ליצור עבורך תוכן מותאם אישית. בואו נמשיך לשלב הבא!',
    isComplete: true,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let requestData: any = {};

    try {
      requestData = JSON.parse(body);
    } catch {
      // If parsing fails, treat as initial request
      requestData = { isInitial: true };
    }

    const { messages = [], isInitial, businessContext } = requestData;

    // Determine conversation stage based on message count
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;

    let responseData: any = {};

    if (isInitial || messages.length === 0) {
      // Initial greeting
      responseData = {
        success: true,
        message: conversationFlow[0].response,
        isComplete: false,
      };
    } else if (userMessageCount === 1) {
      // After first user response - collect unique_value_proposition
      const lastUserMessage = messages[messages.length - 1].content;
      responseData = {
        success: true,
        message: conversationFlow[1].response,
        isComplete: false,
        answers: {
          unique_value_proposition: lastUserMessage,
        },
      };
    } else if (userMessageCount === 2) {
      // After second user response - collect target_audience
      const lastUserMessage = messages[messages.length - 1].content;
      responseData = {
        success: true,
        message: conversationFlow[2].response,
        isComplete: false,
        answers: {
          target_audience: lastUserMessage,
        },
      };
    } else if (userMessageCount >= 3) {
      // After third user response - collect brand_voice and complete
      const lastUserMessage = messages[messages.length - 1].content;
      responseData = {
        success: true,
        message: conversationFlow[3].response,
        isComplete: true,
        finalAnswers: {
          brand_voice: lastUserMessage,
        },
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API] Chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process chat',
      },
      { status: 500 }
    );
  }
}
