import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the URL
    const body = await request.text();
    let url = '';

    try {
      const parsed = JSON.parse(body);
      url = parsed.url || '';
    } catch {
      // If not JSON, treat as plain text
      url = body;
    }

    // Return dummy data - no actual scraping
    const dummyData = {
      branding: {
        company_name: 'החברה שלי',
        tagline: 'פתרונות חדשניים לעסק שלך',
        has_logo: true,
      },
      logo: 'https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=LOGO',
      favicon: 'https://via.placeholder.com/32x32/4F46E5/FFFFFF',
      colors: ['#4F46E5', '#EC4899', '#10B981'],
      fonts: ['Heebo', 'Assistant', 'Open Sans'],
      services: [
        'פיתוח אתרים',
        'ייעוץ עסקי',
        'שיווק דיגיטלי',
        'עיצוב גרפי',
        'קידום ממומן',
      ],
      services_extracted: [
        'בניית אתרים',
        'אפליקציות מובייל',
        'אסטרטגיה דיגיטלית',
      ],
      products_extracted: [
        'מערכת ניהול לקוחות',
        'פלטפורמת מסחר',
      ],
      navigation: {
        menu_items: ['בית', 'שירותים', 'אודות', 'צור קשר', 'בלוג'],
      },
      url: url,
      raw_title: 'החברה שלי - פתרונות חדשניים',
      raw_content: 'תוכן לדוגמה של האתר',
    };

    // Encode as JSON string to simulate TOON format
    const responseData = JSON.stringify(dummyData);

    return NextResponse.json({
      success: true,
      data: responseData,
      format: 'toon',
    });
  } catch (error) {
    console.error('[API] Scan website error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scan website',
      },
      { status: 500 }
    );
  }
}
