import { describe, it, expect } from 'vitest';
import { getStyleCSS, markdownToHtml, PdfStyle, PDF_STYLES } from '@/lib/pdf-styles';

describe('pdf-styles', () => {
  describe('PDF_STYLES', () => {
    it('should have three style options', () => {
      expect(PDF_STYLES).toHaveLength(3);
      expect(PDF_STYLES.map(s => s.id)).toEqual(['modern', 'serif', 'mono']);
    });
  });

  describe('getStyleCSS', () => {
    it('should return CSS containing Inter font for modern style', () => {
      const css = getStyleCSS('modern');
      expect(css).toContain('Inter');
      expect(css).toContain('font-family');
    });

    it('should return CSS containing Crimson Pro font for serif style', () => {
      const css = getStyleCSS('serif');
      expect(css).toContain('Crimson Pro');
    });

    it('should return CSS containing JetBrains Mono font for mono style', () => {
      const css = getStyleCSS('mono');
      expect(css).toContain('JetBrains Mono');
    });

    it('should default to modern style for unknown input', () => {
      const css = getStyleCSS('unknown' as PdfStyle);
      expect(css).toContain('Inter');
    });
  });

  describe('markdownToHtml', () => {
    describe('YAML frontmatter', () => {
      it('should strip YAML frontmatter', () => {
        const md = `---
title: Test
author: Me
---
# Hello`;
        const html = markdownToHtml(md);
        expect(html).not.toContain('---');
        expect(html).not.toContain('title:');
        expect(html).toContain('<h1>Hello</h1>');
      });

      it('should handle markdown without frontmatter', () => {
        const html = markdownToHtml('# Hello');
        expect(html).toContain('<h1>Hello</h1>');
      });
    });

    describe('headers', () => {
      it('should convert h1 headers', () => {
        expect(markdownToHtml('# Title')).toContain('<h1>Title</h1>');
      });

      it('should convert h2 headers', () => {
        expect(markdownToHtml('## Section')).toContain('<h2>Section</h2>');
      });

      it('should convert h3 headers', () => {
        expect(markdownToHtml('### Subsection')).toContain('<h3>Subsection</h3>');
      });

      it('should apply bold formatting in headers', () => {
        expect(markdownToHtml('### **Bold Title**')).toContain('<h3><strong>Bold Title</strong></h3>');
      });

      it('should apply italic formatting in headers', () => {
        expect(markdownToHtml('### *Italic Title*')).toContain('<h3><em>Italic Title</em></h3>');
      });

      it('should apply mixed bold and italic in headers', () => {
        const html = markdownToHtml('### **Bold** | *Italic*');
        expect(html).toContain('<strong>Bold</strong>');
        expect(html).toContain('<em>Italic</em>');
      });

      it('should handle complex header formatting (project titles)', () => {
        const html = markdownToHtml('### **Alignment Engines** | *Multi-Tenant SaaS Platform*');
        expect(html).toContain('<h3>');
        expect(html).toContain('<strong>Alignment Engines</strong>');
        expect(html).toContain('<em>Multi-Tenant SaaS Platform</em>');
        expect(html).toContain('</h3>');
      });
    });

    describe('horizontal rules', () => {
      it('should convert --- to <hr>', () => {
        expect(markdownToHtml('---')).toContain('<hr>');
      });

      it('should not convert --- inside frontmatter', () => {
        const md = `---
title: Test
---
Content`;
        const html = markdownToHtml(md);
        expect(html).not.toContain('<hr>');
        expect(html).toContain('<p>Content</p>');
      });
    });

    describe('lists', () => {
      it('should convert list items', () => {
        const html = markdownToHtml('- Item one\n- Item two');
        expect(html).toContain('<ul>');
        expect(html).toContain('<li>Item one</li>');
        expect(html).toContain('<li>Item two</li>');
        expect(html).toContain('</ul>');
      });

      it('should apply inline formatting in list items', () => {
        const html = markdownToHtml('- **Bold** and *italic* item');
        expect(html).toContain('<li><strong>Bold</strong> and <em>italic</em> item</li>');
      });

      it('should close list when followed by non-list content', () => {
        const html = markdownToHtml('- Item\n\nParagraph');
        expect(html).toContain('</ul>');
        expect(html).toContain('<p>Paragraph</p>');
      });

      it('should close list when followed by header', () => {
        const html = markdownToHtml('- Item\n## Header');
        expect(html).toContain('</ul>');
        expect(html).toContain('<h2>Header</h2>');
      });
    });

    describe('paragraphs', () => {
      it('should wrap text in paragraph tags', () => {
        expect(markdownToHtml('Some text')).toContain('<p>Some text</p>');
      });

      it('should apply inline formatting in paragraphs', () => {
        const html = markdownToHtml('Text with **bold** and *italic*');
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('<em>italic</em>');
      });
    });

    describe('inline formatting', () => {
      it('should convert bold text', () => {
        const html = markdownToHtml('**bold**');
        expect(html).toContain('<strong>bold</strong>');
      });

      it('should convert italic text', () => {
        const html = markdownToHtml('*italic*');
        expect(html).toContain('<em>italic</em>');
      });

      it('should convert links', () => {
        const html = markdownToHtml('[Click here](https://example.com)');
        expect(html).toContain('<a href="https://example.com">Click here</a>');
      });

      it('should convert pipe separators to styled spans', () => {
        const html = markdownToHtml('Item 1 | Item 2');
        expect(html).toContain('<span class="sep">|</span>');
      });

      it('should handle multiple formatting in one line', () => {
        const html = markdownToHtml('**Bold** and *italic* and [link](url)');
        expect(html).toContain('<strong>Bold</strong>');
        expect(html).toContain('<em>italic</em>');
        expect(html).toContain('<a href="url">link</a>');
      });

      it('should not apply italic inside words', () => {
        const html = markdownToHtml('file_name_here');
        expect(html).not.toContain('<em>');
      });
    });

    describe('empty lines', () => {
      it('should preserve empty lines', () => {
        const html = markdownToHtml('Line 1\n\nLine 2');
        const lines = html.split('\n');
        expect(lines.some(l => l === '')).toBe(true);
      });
    });

    describe('complex documents', () => {
      it('should handle a typical resume structure', () => {
        const md = `---
title: Resume
---
# John Doe

Email | Phone | Location

## Experience

### **Company** | *Role*

- Achievement one
- Achievement two

## Skills

- Skill one
- Skill two`;

        const html = markdownToHtml(md);
        
        expect(html).toContain('<h1>John Doe</h1>');
        expect(html).toContain('<h2>Experience</h2>');
        expect(html).toContain('<h3>');
        expect(html).toContain('<strong>Company</strong>');
        expect(html).toContain('<em>Role</em>');
        expect(html).toContain('<li>Achievement one</li>');
        expect(html).toContain('<h2>Skills</h2>');
      });
    });
  });
});
