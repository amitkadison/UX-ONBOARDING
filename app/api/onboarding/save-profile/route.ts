import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let profileData: any = {};

    try {
      profileData = JSON.parse(body);
    } catch {
      // If parsing fails, use empty object
      profileData = {};
    }

    // Simulate saving to database - just return success with dummy profile
    const dummyProfile = {
      id: 'profile_' + Math.random().toString(36).substring(7),
      company_name: profileData.company_name || 'החברה שלי',
      onboarding_completed: true,
    };

    console.log('[API] Profile saved (dummy):', dummyProfile);

    return NextResponse.json({
      success: true,
      profile: dummyProfile,
    });
  } catch (error) {
    console.error('[API] Save profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save profile',
      },
      { status: 500 }
    );
  }
}
