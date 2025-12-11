/**
 * WebsiteScan Component
 * URL input and website scanning with results display
 * Uses TOON format for token-efficient data transfer
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronDown, ChevronUp, Eye, Code } from 'lucide-react';
import { OnboardingData } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { safeToonDecode as centralizedSafeToonDecode, safeToonEncodeString } from '@/lib/toon-utils';

// Helper to maintain existing API (body + contentType)
function safeToonEncode(data: unknown): { body: string; contentType: string } {
  return { body: safeToonEncodeString(data), contentType: 'text/plain' };
}

// Helper that returns data directly (matching old API)
function safeToonDecode(str: string): unknown {
  const { data, error } = centralizedSafeToonDecode(str);
  if (data === null) {
    throw new Error(error || 'Failed to parse response data');
  }
  return data;
}

interface WebsiteScanProps {
  data: OnboardingData;
  onDataChange: (data: OnboardingData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WebsiteScan({ data, onDataChange, onNext, onBack }: WebsiteScanProps) {
  const [url, setUrl] = useState(data.site_url || '');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(!!data.company_name);
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'toon'>('normal');
  const [error, setError] = useState<string | null>(null);

  // Sanitize URL - remove hidden characters that can break TOON encoding
  const sanitizeUrl = (rawUrl: string): string => {
    return rawUrl
      .trim()
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // Zero-width chars, BOM, non-breaking space
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/\s+$/, ''); // Trailing whitespace
  };

  const handleScan = async () => {
    if (!url.trim()) return;

    setIsScanning(true);
    setError(null);

    try {
      const cleanUrl = sanitizeUrl(url);
      const { body, contentType } = safeToonEncode({ url: cleanUrl });
      const response = await fetch('/api/onboarding/scan-website', {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to scan website');
      }

      // Decode response - supports both TOON and JSON formats with fallback
      let scrapedData: any;
      if (typeof result.data === 'string') {
        // Try TOON first, then JSON - safeToonDecode handles both
        scrapedData = safeToonDecode(result.data);
        console.log(`[WebsiteScan] Decoded data (format: ${result.format}):`, scrapedData);
      } else {
        throw new Error('Invalid response format');
      }
      const companyName = scrapedData.branding?.company_name || '';
      const tagline = scrapedData.branding?.tagline || '';
      const logoUrl = scrapedData.logo || null;
      const faviconUrl = scrapedData.favicon || null;
      const brandColors = scrapedData.colors || [];
      const brandFonts = scrapedData.fonts || [];

      // Extract services/products - prefer LLM-extracted services (more accurate)
      // Priority: LLM services > scraper services > menu items (filtered)
      const llmServices = scrapedData.services || []; // From LLM extraction
      const servicesExtracted = scrapedData.services_extracted || []; // From scraper
      const productsExtracted = scrapedData.products_extracted || [];
      const menuItems = scrapedData.navigation?.menu_items || [];

      // Use LLM services if available (most accurate), then scraper, then menu items
      const combinedServices = llmServices.length > 0
        ? llmServices
        : servicesExtracted.length > 0
          ? servicesExtracted
          : menuItems.filter((item: string) =>
              !['בית', 'צור קשר', 'אודות', 'home', 'contact', 'about'].includes(item.toLowerCase())
            );

      // Update data with scraped info
      const updatedData = {
        ...data,
        source: 'website' as const,
        site_url: url,
        company_name: companyName,
        industry: '', // Will be determined by questionnaire
        mission: tagline,
        products_services: [...new Set([...combinedServices, ...productsExtracted])].slice(0, 15),
        target_audience: '',
        unique_value_proposition: '',
        brand_voice: '',
        key_messaging: [], // Will be filled during questionnaire
        visual_elements: scrapedData.branding,
        logo_url: logoUrl, // Logo URL extracted from website
        favicon_url: faviconUrl, // Favicon URL extracted from website
        brand_colors: brandColors, // Brand colors extracted from CSS
        brand_fonts: brandFonts, // Font families used on the site
        raw_scraped_data: scrapedData, // Store full scraped data for questionnaire generation
      };

      onDataChange(updatedData);

      // Generate dynamic questions based on scraped data
      try {
        const questionsReq = safeToonEncode({ scrapedData });
        const questionsResponse = await fetch('/api/onboarding/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': questionsReq.contentType },
          body: questionsReq.body,
        });

        const questionsResult = await questionsResponse.json();

        if (questionsResult.success && questionsResult.questions?.length > 0) {
          onDataChange({
            ...updatedData,
            dynamic_questionnaire: questionsResult.questions,
          });
        }
      } catch (questionsError) {
        console.error('Failed to generate questions:', questionsError);
        // Continue without dynamic questions - user can still proceed
      }

      setHasScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan website');
    } finally {
      setIsScanning(false);
    }
  };

  // Convert data to TOON format for display (with fallback via centralized utility)
  const toonString = safeToonEncodeString(data);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">סריקת האתר</h2>
        <p className="text-muted-foreground">
          הזן את כתובת האתר שלך ונאסוף את המידע הרלוונטי
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-3">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="text-left"
            dir="ltr"
            disabled={isScanning}
          />
          <Button
            onClick={handleScan}
            disabled={!url.trim() || isScanning}
            className="min-w-[140px]"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                סורק...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 ml-2" />
                סרוק אתר
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="text-destructive text-sm mt-2">{error}</p>
        )}
      </div>

      {isScanning && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-4 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-medium text-foreground">סורק את האתר...</p>
          <p className="text-sm text-muted-foreground">אוספים מידע מהדפים השונים</p>
        </div>
      )}

      {hasScanned && !isScanning && data.company_name && (
        <div className="max-w-4xl mx-auto">
          {/* Success message */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">
              הסריקה הושלמה בהצלחה!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              נאספו {data.products_services.length} שירותים, {data.key_messaging.length} מסרים מרכזיים
            </p>
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setIsDataVisible(!isDataVisible)}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-lg border transition-all',
              isDataVisible
                ? 'bg-card border-primary/20'
                : 'bg-secondary/50 border-border hover:border-primary/20'
            )}
          >
            <span className="font-medium text-foreground">
              {isDataVisible ? 'הסתר פרטים' : 'הצג מידע שנאסף'}
            </span>
            {isDataVisible ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {/* Collapsible content */}
          {isDataVisible && (
            <div className="mt-4 animate-in slide-in-from-top-2">
              {/* View mode toggle */}
              <div className="flex items-center gap-2 mb-4 justify-center">
                <div className="inline-flex rounded-lg border border-border p-1 bg-secondary/50">
                  <button
                    onClick={() => setViewMode('normal')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                      viewMode === 'normal'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Eye className="w-4 h-4" />
                    תצוגה רגילה
                  </button>
                  <button
                    onClick={() => setViewMode('toon')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                      viewMode === 'toon'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Code className="w-4 h-4" />
                    TOON
                  </button>
                </div>
              </div>

              {viewMode === 'normal' ? (
                <div className="space-y-4 bg-card rounded-lg border p-6">
                  {/* Logo display */}
                  {data.logo_url && (
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <div className="flex-shrink-0">
                        <img
                          src={data.logo_url}
                          alt="Logo"
                          className="h-16 w-auto max-w-32 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        לוגו נמצא
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">שם החברה</label>
                    <p className="text-foreground">{data.company_name}</p>
                  </div>
                  {data.industry && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">תעשייה</label>
                      <p className="text-foreground">{data.industry}</p>
                    </div>
                  )}
                  {data.brand_voice && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">טון המותג</label>
                      <p className="text-foreground">{data.brand_voice}</p>
                    </div>
                  )}
                  {data.products_services.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">שירותים</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.products_services.map((service, idx) => (
                          <Badge key={idx} variant="secondary">{service}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.key_messaging.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">מסרים מרכזיים</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.key_messaging.map((msg, idx) => (
                          <Badge key={idx} variant="outline">{msg}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.brand_colors && data.brand_colors.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">צבעי מותג</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.brand_colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-2 py-1 rounded border bg-background"
                          >
                            <div
                              className="w-5 h-5 rounded border"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.brand_fonts && data.brand_fonts.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">גופנים</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.brand_fonts.map((font, idx) => (
                          <Badge key={idx} variant="secondary">{font}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-lg border overflow-hidden">
                  <pre
                    className="p-4 overflow-auto max-h-[500px] text-xs leading-relaxed font-mono"
                    dir="ltr"
                  >
                    <code className="text-foreground">{toonString}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between mt-8 max-w-2xl mx-auto">
        <Button variant="outline" onClick={onBack}>
          חזור
        </Button>
        <Button
          onClick={onNext}
          disabled={!hasScanned}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          המשך לשלב הבא
        </Button>
      </div>
    </div>
  );
}
