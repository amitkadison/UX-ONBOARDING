/**
 * TOON Utility Functions
 *
 * Thin wrappers around the official @toon-format/toon library that add:
 * 1. Markdown code block extraction (LLMs often wrap responses in ```toon```)
 * 2. Unicode sanitization (smart quotes, zero-width chars, etc.)
 * 3. Graceful JSON fallback when TOON parsing fails
 *
 * The official TOON library handles encoding/decoding but doesn't provide
 * these pre/post processing features needed for robust LLM integration.
 */

import { decode as toonDecode, encode as toonEncode } from '@toon-format/toon';

// Re-export official functions for direct use when wrappers aren't needed
export { toonDecode, toonEncode };

/**
 * PRE-PROCESSING: Extract content from markdown code blocks
 *
 * LLMs frequently wrap TOON responses in markdown code blocks like:
 * ```toon
 * .key
 * value
 * ```
 *
 * This function extracts the content from such blocks.
 * If no code block is found, returns the trimmed original text.
 */
export function extractFromCodeBlock(text: string): string {
  // Match ```toon, ```json, or just ``` code blocks
  const match = text.match(/```(?:toon|json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

/**
 * PRE-PROCESSING: Sanitize problematic characters before encoding
 *
 * The official TOON library doesn't handle these characters that commonly
 * appear in scraped web content or LLM responses:
 * - Smart quotes: ' ' " "
 * - Zero-width characters: \u200B-\u200D, \uFEFF
 * - Non-breaking spaces: \u00A0
 * - Control characters: \x00-\x1F, \x7F
 * - Backslashes (can cause escaping issues)
 */
export function sanitizeForToon(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes -> straight
      .replace(/[\u201C\u201D]/g, "'") // Smart double quotes -> single (avoid TOON escaping issues)
      .replace(/"/g, "'") // Double quotes -> single quotes (TOON escaping issues)
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars (invisible but break parsing)
      .replace(/\u00A0/g, ' ') // Non-breaking space -> regular space
      .replace(/[\x00-\x1F\x7F]/g, '') // Control characters (can corrupt output)
      .replace(/\\/g, '/'); // Backslashes -> forward slashes (avoid escape conflicts)
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForToon);
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeForToon(value);
    }
    return result;
  }
  return obj;
}

/**
 * Result type for safeToonDecode
 */
export interface ToonDecodeResult<T> {
  data: T | null;
  format: 'toon' | 'json' | 'failed';
  error?: string;
}

/**
 * SAFE DECODE: Pre-process + official decode + JSON fallback
 *
 * This function:
 * 1. Extracts content from markdown code blocks (if present)
 * 2. Attempts TOON decode using official library
 * 3. Falls back to JSON parse if TOON fails
 * 4. Returns structured result with format indicator
 *
 * @param text - Raw text that may contain TOON, JSON, or markdown-wrapped content
 * @param options - Optional decode options (strict mode)
 * @returns Object with decoded data, format used, and any error message
 */
export function safeToonDecode<T = unknown>(
  text: string,
  options?: { strict?: boolean }
): ToonDecodeResult<T> {
  // Step 1: Extract from code block (our pre-processing)
  const content = extractFromCodeBlock(text);

  // Step 2: Try official TOON decode
  try {
    const data = toonDecode(content, { strict: options?.strict ?? false }) as T;
    return { data, format: 'toon' };
  } catch (toonError) {
    // Step 3: Fallback to JSON (our resilience layer)
    try {
      const data = JSON.parse(content) as T;
      return { data, format: 'json' };
    } catch (jsonError) {
      return {
        data: null,
        format: 'failed',
        error: `TOON: ${toonError instanceof Error ? toonError.message : String(toonError)}, JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
      };
    }
  }
}

/**
 * Result type for safeToonEncode
 */
export interface ToonEncodeResult {
  encoded: string;
  format: 'toon' | 'json';
}

/**
 * SAFE ENCODE: Sanitize + official encode + JSON fallback
 *
 * This function:
 * 1. Sanitizes problematic characters (smart quotes, zero-width, etc.)
 * 2. Attempts TOON encode using official library
 * 3. Falls back to JSON stringify if TOON fails
 * 4. Returns structured result with format indicator
 *
 * @param data - Data to encode
 * @returns Object with encoded string and format used
 */
export function safeToonEncode(data: unknown): ToonEncodeResult {
  try {
    // Step 1: Sanitize (our pre-processing)
    const sanitized = sanitizeForToon(data);
    // Step 2: Official TOON encode
    return { encoded: toonEncode(sanitized), format: 'toon' };
  } catch (e) {
    // Step 3: Fallback to JSON (our resilience layer)
    console.warn('[toon-utils] TOON encode failed, using JSON:', e);
    return { encoded: JSON.stringify(data), format: 'json' };
  }
}

/**
 * Simple encode helper that returns just the string (for prompts)
 * Falls back to JSON on failure without format indicator
 */
export function safeToonEncodeString(data: unknown): string {
  const { encoded } = safeToonEncode(data);
  return encoded;
}
