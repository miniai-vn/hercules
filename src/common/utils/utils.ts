import dayjs from 'dayjs';

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const isAfter = (
  timestamp: number,
  amount: number,
  unit: dayjs.ManipulateType,
  isMilliseconds: boolean = false,
): boolean => {
  const targetTime = dayjs().subtract(amount, unit);
  const messageTime = isMilliseconds ? dayjs(timestamp) : dayjs.unix(timestamp);
  return messageTime.isAfter(targetTime);
};

// generate random unique with characters
const generateRandomUnique = (length: number): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

/**
 * Convert HTML to plain text
 * @param html - HTML string to convert
 * @param options - Configuration options
 * @returns Plain text string
 */
const htmlToText = (
  html: string,
  options: {
    preserveNewlines?: boolean;
    preserveSpaces?: boolean;
    trimWhitespace?: boolean;
  } = {},
): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const {
    preserveNewlines = true,
    preserveSpaces = false,
    trimWhitespace = true,
  } = options;

  let text = html;

  // Replace common block elements with newlines
  if (preserveNewlines) {
    text = text.replace(/<\/(div|p|br|h[1-6]|li|tr)>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/li>/gi, '\n');
  }

  // Remove all HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-F]+);/gi, (match, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (match, dec) =>
      String.fromCharCode(parseInt(dec, 10)),
    );

  if (!preserveSpaces) {
    // Replace multiple spaces with single space
    text = text.replace(/\s+/g, ' ');
  }

  if (trimWhitespace) {
    // Remove leading/trailing whitespace and normalize line breaks
    text = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      .trim();
  }

  return text;
};

/**
 * Simple HTML to text converter (basic version)
 * @param html - HTML string to convert
 * @returns Plain text string
 */
const simpleHtmlToText = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract text content from HTML with better formatting
 * @param html - HTML string to convert
 * @returns Formatted plain text
 */
const htmlToFormattedText = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let text = html;

  // Handle lists
  text = text.replace(/<li[^>]*>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');

  // Handle headings
  text = text.replace(/<h[1-6][^>]*>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n');

  // Handle paragraphs and divs
  text = text.replace(/<\/?(p|div)[^>]*>/gi, '\n\n');

  // Handle line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Handle table cells
  text = text.replace(/<\/?(td|th)[^>]*>/gi, ' | ');
  text = text.replace(/<\/tr>/gi, '\n');

  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Clean up whitespace
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .replace(/\n /g, '\n') // Remove leading spaces after newlines
    .trim();

  return text;
};

/**
 * Strip HTML tags and return clean text (most basic version)
 * @param html - HTML string to clean
 * @returns Clean text without HTML tags
 */
const stripHtmlTags = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html.replace(/<[^>]*>/g, '').trim();
};

export {
  delay,
  isAfter,
  generateRandomUnique,
  htmlToText,
  simpleHtmlToText,
  htmlToFormattedText,
  stripHtmlTags,
};
