import type { ReactNode } from 'react';

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /!\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined || match[2] !== undefined) {
      const alt = match[1] ?? '';
      const src = match[2] ?? '';
      nodes.push(
        // eslint-disable-next-line @next/next/no-img-element -- markdown content may include arbitrary inline images
        <img
          key={`${keyPrefix}-img-${index}`}
          src={src}
          alt={alt}
          className="my-6 h-auto w-full rounded-sm object-cover"
          loading="lazy"
        />,
      );
    } else if (match[3] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-strong-${index}`}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-em-${index}`}>{match[4]}</em>);
    } else if (match[5] !== undefined && match[6] !== undefined) {
      const href = match[6];
      const safeHref = /^(https?:\/\/|\/|#)/.test(href) ? href : '#';
      nodes.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          href={safeHref}
          className="underline underline-offset-4 transition-colors hover:text-[var(--underline-color)]"
        >
          {match[5]}
        </a>,
      );
    }

    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

/**
 * Renders a small, safe subset of Markdown as React nodes.
 * Raw HTML is not injected, so script tags cannot execute.
 */
export function renderMarkdown(body: string): ReactNode {
  const source = body.replace(/\r\n/g, '\n');
  const blocks = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, blockIndex) => {
    const key = `md-${blockIndex}`;
    const lines = block.split('\n');
    const heading = /^(#{1,3})\s+(.*)$/.exec(lines[0] ?? '');

    if (heading && lines.length === 1) {
      const level = heading[1].length;
      const content = renderInline(heading[2], key);
      const className = 'font-heading tracking-[0.06em]';

      if (level === 1) {
        return (
          <h2 key={key} className={`${className} mt-8 text-2xl`}>
            {content}
          </h2>
        );
      }

      if (level === 2) {
        return (
          <h3 key={key} className={`${className} mt-8 text-xl`}>
            {content}
          </h3>
        );
      }

      return (
        <h4 key={key} className={`${className} mt-6 text-lg`}>
          {content}
        </h4>
      );
    }

    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return (
        <ul
          key={key}
          className="my-4 list-disc space-y-2 pl-6 text-sm leading-7 text-muted sm:text-base"
        >
          {lines.map((line, itemIndex) => (
            <li key={`${key}-li-${itemIndex}`}>
              {renderInline(line.replace(/^[-*]\s+/, ''), `${key}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
    }

    const imageOnly = /^!\[[^\]]*\]\([^)]+\)$/.test(block);
    if (imageOnly) {
      return (
        <div key={key} className="my-6">
          {renderInline(block, key)}
        </div>
      );
    }

    return (
      <p key={key} className="my-4 text-sm leading-7 text-muted sm:text-base">
        {renderInline(block.replace(/\n/g, ' '), key)}
      </p>
    );
  });
}
