import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Return dummy questions
    const dummyQuestions = [
      {
        field: 'target_audience',
        description: 'קהל יעד של העסק',
        question_for_client: 'מי הם הלקוחות העיקריים שלכם?',
      },
      {
        field: 'unique_value_proposition',
        description: 'הצעת הערך הייחודית',
        question_for_client: 'מה מייחד אתכם מהמתחרים?',
      },
      {
        field: 'brand_voice',
        description: 'טון המותג',
        question_for_client: 'איך תרצו שהמותג שלכם ישמע? (מקצועי, ידידותי, צעיר וכו\')',
      },
    ];

    return NextResponse.json({
      success: true,
      questions: dummyQuestions,
    });
  } catch (error) {
    console.error('[API] Generate questions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate questions',
      },
      { status: 500 }
    );
  }
}
