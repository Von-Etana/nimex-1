import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeText, sanitizeUrl } from '../lib/sanitization';

describe('Sanitization Utilities', () => {

  describe('sanitizeHtml', () => {
    // Happy Path Tests
    it('should allow basic safe HTML tags and attributes', () => {
      const input = '<p>Hello <strong>World</strong>, check this <a href="https://example.com" target="_blank" rel="noopener">link</a>.</p>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<p>Hello <strong>World</strong>, check this <a href="https://example.com" target="_blank" rel="noopener">link</a>.</p>');
    });

    it('should preserve formatting tags like headings, lists, and images', () => {
      const input = '<h1>Title</h1><ul><li>Item 1</li></ul><img src="https://example.com/img.jpg" alt="test image" />';
      const result = sanitizeHtml(input);
      expect(result).toBe('<h1>Title</h1><ul><li>Item 1</li></ul><img src="https://example.com/img.jpg" alt="test image">');
    });

    // Edge Cases
    it('should return empty string for null, undefined, or empty string inputs', () => {
      expect(sanitizeHtml('')).toBe('');
      // @ts-expect-error - Testing runtime tolerance for invalid input types
      expect(sanitizeHtml(null)).toBe('');
      // @ts-expect-error - Testing runtime tolerance for invalid input types
      expect(sanitizeHtml(undefined)).toBe('');
    });

    it('should return empty string for non-string inputs at runtime', () => {
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeHtml(123)).toBe('');
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeHtml({})).toBe('');
    });

    it('should correctly balance unclosed HTML tags', () => {
      const input = '<div>Unclosed <strong>tag';
      // DOMPurify automatically closes open tags and strips unsupported ones (like div, which is not in purifyConfig.ALLOWED_TAGS)
      // Since 'div' is not in ALLOWED_TAGS, it should strip the div tag but keep its text content, and close the strong tag.
      const result = sanitizeHtml(input);
      expect(result).toBe('Unclosed <strong>tag</strong>');
    });

    // Security & Error Handling Tests (Malicious Injections)
    it('should strip out script tags entirely', () => {
      const input = '<p>Normal text</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<p>Normal text</p>');
    });

    it('should strip out event handler attributes from allowed tags', () => {
      const input = '<img src="https://example.com/image.jpg" onerror="alert(1)" onload="console.log(1)" onclick="steal()" />';
      const result = sanitizeHtml(input);
      expect(result).toBe('<img src="https://example.com/image.jpg">');
    });

    it('should strip out forbidden elements like iframe, style, embed, and object', () => {
      const input = '<iframe src="https://malicious.com"></iframe><style>body { color: red; }</style><embed src="plugin.swf">';
      const result = sanitizeHtml(input);
      expect(result).toBe('');
    });

    it('should remove javascript: pseudo-protocol from href attributes in anchor tags', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeHtml(input);
      // DOMPurify strips invalid/unsafe protocols or the entire attribute
      expect(result).toBe('<a>Click me</a>');
    });

    it('should strip nested malicious tag combinations', () => {
      const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('ipt>');
    });
  });

  describe('sanitizeText', () => {
    // Happy Path Tests
    it('should return the original string if it contains no special characters', () => {
      const input = 'Hello World 12345';
      const result = sanitizeText(input);
      expect(result).toBe(input);
    });

    // Edge Cases & Error Handling
    it('should return empty string for null, undefined, or non-string inputs', () => {
      expect(sanitizeText('')).toBe('');
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeText(null)).toBe('');
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeText(undefined)).toBe('');
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeText(12345)).toBe('');
    });

    it('should correctly escape HTML special characters to prevent HTML/XSS injection', () => {
      const input = 'Amps & Hooks <brackets> "quotes" \'single-quotes\' /slashes/';
      const expected = 'Amps &amp; Hooks &lt;brackets&gt; &quot;quotes&quot; &#x27;single-quotes&#x27; &#x2F;slashes&#x2F;';
      const result = sanitizeText(input);
      expect(result).toBe(expected);
    });

    it('should handle strings consisting entirely of special characters', () => {
      expect(sanitizeText('&')).toBe('&amp;');
      expect(sanitizeText('<')).toBe('&lt;');
      expect(sanitizeText('>')).toBe('&gt;');
      expect(sanitizeText('"')).toBe('&quot;');
      expect(sanitizeText("'")).toBe('&#x27;');
      expect(sanitizeText('/')).toBe('&#x2F;');
    });
  });

  describe('sanitizeUrl', () => {
    // Happy Path Tests
    it('should allow valid http and https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://sub.domain.org/path/to/resource?query=1#hash')).toBe('http://sub.domain.org/path/to/resource?query=1#hash');
    });

    // Edge Cases
    it('should return empty string for null, undefined, or non-string inputs', () => {
      expect(sanitizeUrl('')).toBe('');
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeUrl(null)).toBe('');
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeUrl(undefined)).toBe('');
    });

    it('should allow protocols with mixed case', () => {
      expect(sanitizeUrl('HTTPS://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('Http://example.com')).toBe('http://example.com/');
    });

    it('should reject URLs with invalid formats', () => {
      expect(sanitizeUrl('not-a-valid-url')).toBe('');
      expect(sanitizeUrl('http://')).toBe('');
    });

    it('should reject relative URLs because they cannot be parsed as absolute URLs without a base', () => {
      expect(sanitizeUrl('/path/to/file')).toBe('');
      expect(sanitizeUrl('relative-dir/file.html')).toBe('');
    });

    // Security & Protocol Tests
    it('should block unsafe protocols like javascript:, data:, file:, and ftp:', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
      expect(sanitizeUrl('ftp://example.com/file.txt')).toBe('');
      expect(sanitizeUrl('vbscript:msgbox("hello")')).toBe('');
    });
  });
});
