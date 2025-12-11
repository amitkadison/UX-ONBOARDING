'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, RotateCcw, CheckCircle2, Pencil, Save, X, Loader2 } from 'lucide-react';
import { safeToonEncodeString } from '@/lib/toon-utils';
import { cn } from '@/lib/utils';

interface SummaryProps {
  data: {
    source: 'website' | 'questionnaire';
    siteUrl?: string;
    companyName: string;
    industry?: string;
    mission?: string;
    productsServices: string[];
    targetAudience?: string;
    uniqueValueProposition?: string;
    brandVoice?: string;
    keyMessaging: string[];
    competitorsValid: string[];
    competitorsInvalid: string[];
    questionnaireAnswers?: Record<string, string>;
    // Visual branding
    logoUrl?: string;
    brandColors?: string[];
    brandFonts?: string[];
  };
  onDataChange: (field: string, value: any) => void;
  onStartOver: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

interface EditableFieldProps {
  label: string;
  value: string | string[];
  field: string;
  onSave: (field: string, value: any) => void;
  multiline?: boolean;
  isArray?: boolean;
}

function EditableField({ label, value, field, onSave, multiline = false, isArray = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    isArray ? (value as string[]).join(', ') : (value as string)
  );

  const handleSave = () => {
    const finalValue = isArray
      ? editValue.split(',').map((item) => item.trim()).filter(Boolean)
      : editValue;
    onSave(field, finalValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(isArray ? (value as string[]).join(', ') : (value as string));
    setIsEditing(false);
  };

  const displayValue = isArray ? (value as string[]).join(', ') : value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          {multiline || isArray ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={isArray ? 3 : 4}
              className="resize-none"
              dir="rtl"
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              dir="rtl"
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="h-3 w-3" />
              ביטול
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
            >
              <Save className="h-3 w-3" />
              שמור
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md min-h-[2.5rem] flex items-center" dir="rtl">
          {displayValue || <span className="text-muted-foreground/50">לא הוזן ערך</span>}
        </div>
      )}
    </div>
  );
}

function ToonPreview({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);
  const toonString = safeToonEncodeString(data);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(toonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">תצוגת TOON</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              הועתק
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              העתק
            </>
          )}
        </Button>
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px] text-xs font-mono" dir="ltr">
        {toonString}
      </pre>
    </div>
  );
}

export default function Summary({ data, onDataChange, onStartOver, onComplete, isSubmitting }: SummaryProps) {
  // Prepare display data - simplified to essential fields only
  const displayData = {
    companyName: data.companyName,
    ...(data.siteUrl && { siteUrl: data.siteUrl }),
    productsServices: data.productsServices,
    ...(data.competitorsValid.length > 0 && { competitors: data.competitorsValid }),
    ...(data.logoUrl && { logoUrl: data.logoUrl }),
    ...(data.brandColors && data.brandColors.length > 0 && { brandColors: data.brandColors }),
    ...(data.brandFonts && data.brandFonts.length > 0 && { brandFonts: data.brandFonts }),
  };

  const renderEditableFields = () => (
    <div className="space-y-6">
      {/* Logo */}
      {data.logoUrl && (
        <div className="space-y-2">
          <label className="text-sm font-medium">לוגו</label>
          <div className="p-4 bg-muted rounded-lg flex justify-center">
            <img
              src={data.logoUrl}
              alt="לוגו"
              className="max-h-20 max-w-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Company Name */}
      <EditableField
        label="שם החברה"
        value={data.companyName}
        field="companyName"
        onSave={onDataChange}
      />

      {/* Website URL */}
      {data.source === 'website' && data.siteUrl && (
        <EditableField
          label="כתובת האתר"
          value={data.siteUrl}
          field="siteUrl"
          onSave={onDataChange}
        />
      )}

      {/* Services/Products */}
      <EditableField
        label="שירותים ומוצרים"
        value={data.productsServices}
        field="productsServices"
        onSave={onDataChange}
        isArray
      />

      {/* Competitors */}
      {data.competitorsValid.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">מתחרים</label>
          <div className="flex flex-wrap gap-2">
            {data.competitorsValid.map((competitor, index) => (
              <Badge key={index} variant="secondary">
                {competitor}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Brand Colors */}
      {data.brandColors && data.brandColors.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">צבעי מותג</label>
          <div className="flex flex-wrap gap-2">
            {data.brandColors.map((color, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background"
              >
                <div
                  className="w-6 h-6 rounded border shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand Fonts */}
      {data.brandFonts && data.brandFonts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">גופנים</label>
          <div className="flex flex-wrap gap-2">
            {data.brandFonts.map((font, index) => (
              <Badge key={index} variant="outline">
                {font}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">סיכום ואישור</h2>
        <p className="text-muted-foreground">
          סקור את המידע שנאסף ובצע תיקונים במידת הצורך
        </p>
      </div>

      {/* Desktop: Side by side layout */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>מידע ניתן לעריכה</CardTitle>
          </CardHeader>
          <CardContent>
            {renderEditableFields()}
          </CardContent>
        </Card>

        <Card className="sticky top-6 h-fit">
          <CardContent className="pt-6">
            <ToonPreview data={displayData} />
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Tabs layout */}
      <div className="lg:hidden">
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">עריכה</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>מידע ניתן לעריכה</CardTitle>
              </CardHeader>
              <CardContent>
                {renderEditableFields()}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="json" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <ToonPreview data={displayData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onStartOver}
          disabled={isSubmitting}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          התחל מחדש
        </Button>
        <Button
          onClick={onComplete}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              סיים
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
