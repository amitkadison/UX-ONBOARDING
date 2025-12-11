import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let urls: string[] = [];

    try {
      const parsed = JSON.parse(body);
      urls = parsed.urls || [];
    } catch {
      // If parsing fails, return empty results
      urls = [];
    }

    // Simulate validation - all URLs are valid in dummy mode
    const results = urls.map((url) => ({
      url,
      valid: true,
    }));

    const summary = {
      valid: urls,
      invalid: [],
    };

    return NextResponse.json({
      success: true,
      results,
      summary,
    });
  } catch (error) {
    console.error('[API] Validate URLs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate URLs',
      },
      { status: 500 }
    );
  }
}
