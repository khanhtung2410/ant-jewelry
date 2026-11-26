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

  it('reserves space for markdown images so late loading cannot shift the footer', () => {
    const html = renderToStaticMarkup(
      <div>{renderMarkdown('![Nhẫn cưới](/mock/blog/cover-wedding-band.svg)')}</div>,
    );

    expect(html).toMatch(
      /<img[^>]+src="\/mock\/blog\/cover-wedding-band\.svg"[^>]+width="1200"[^>]+height="630"/,
    );
  });

  it('keeps raw HTML inert so scripts do not execute', () => {
    const html = renderToStaticMarkup(
      <div>{renderMarkdown('Xin chào <script>alert("xss")</script> **an toàn**')}</div>,
    );

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(html).toContain('<strong>an toàn</strong>');
  });

  it('keeps safe links but does not render protocol-relative links', () => {
    const html = renderToStaticMarkup(
      <div>
        {renderMarkdown(
          '[an toàn](https://example.com) [nội bộ](/blog/abc) [x](//evil.com) [y](javascript:alert(1))',
        )}
      </div>,
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="/blog/abc"');
    expect(html).not.toContain('//evil.com');
    expect(html).not.toContain('javascript:');
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(html).toContain('x');
    expect(html).toContain('y');
  });

  it('does not render images with an unsafe scheme', () => {
    const html = renderToStaticMarkup(<div>{renderMarkdown('![x](javascript:alert(1))')}</div>);

    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('x');
  });

  it('does not render protocol-relative images', () => {
    const html = renderToStaticMarkup(<div>{renderMarkdown('![x](//evil.com/a.png)')}</div>);

    expect(html).not.toContain('<img');
    expect(html).not.toContain('//evil.com');
    expect(html).toContain('x');
  });

  it('does not render backslash protocol-relative links or images', () => {
    const linkHtml = renderToStaticMarkup(<div>{renderMarkdown('[x](/\\evil.com)')}</div>);
    const imageHtml = renderToStaticMarkup(<div>{renderMarkdown('![x](/\\evil.com/a.png)')}</div>);

    expect(linkHtml).not.toContain('<a ');
    expect(linkHtml).toContain('x');
    expect(linkHtml).not.toContain('evil.com');

    expect(imageHtml).not.toContain('<img');
    expect(imageHtml).toContain('x');
    expect(imageHtml).not.toContain('evil.com');
  });

  it('does not render links from urls with control characters', () => {
    const html = renderToStaticMarkup(
      <div>
        {renderMarkdown('[tab](/\t/evil.com) [newline](/\n/evil.com) [backslash](/\\evil.com)')}
      </div>,
    );

    expect(html).not.toContain('<a ');
    expect(html).not.toContain('href=');
    expect(html).toContain('tab');
    expect(html).toContain('newline');
    expect(html).toContain('backslash');
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
