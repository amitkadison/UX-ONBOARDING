'use client';

import { GlassOnboarding } from '@/components/onboarding/GlassOnboarding';

export default function Home() {
  const handleComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    // Here you would typically save to database or navigate to next page
  };

  return (
    <GlassOnboarding onComplete={handleComplete} />
  );
}
