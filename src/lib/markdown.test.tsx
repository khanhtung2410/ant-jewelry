import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders paragraphs and interspersed images', () => {
    const html = renderToStaticMarkup(
      <div>
        {renderMarkdown(
          'Đoạn một.\n\n![Nhẫn cưới](/mock/blog/cover-wedding-band.svg)\n\nĐoạn hai.',
        )}
      </div>,
    );

    expect(html).toContain('<p');
    expect(html).toContain('Đoạn một.');
    expect(html).toContain('Đoạn hai.');
    expect(html).toContain('<img');
    expect(html).toContain('src="/mock/blog/cover-wedding-band.svg"');
    expect(html).toContain('alt="Nhẫn cưới"');
  });

  it('keeps raw HTML inert so scripts do not execute', () => {
    const html = renderToStaticMarkup(
      <div>{renderMarkdown('Xin chào <script>alert("xss")</script> **an toàn**')}</div>,
    );

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(html).toContain('<strong>an toàn</strong>');
  });

  it('renders headings and bullet lists', () => {
    const html = renderToStaticMarkup(
      <div>{renderMarkdown('## Tiêu đề\n\n- Mục một\n- Mục hai')}</div>,
    );

    expect(html).toContain('<h3');
    expect(html).toContain('Tiêu đề');
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('Mục một');
  });
});
