import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdminStatusToast } from './admin-status-toast';

describe('AdminStatusToast', () => {
  it('announces progress with a bottom-left live status', () => {
    const html = renderToStaticMarkup(<AdminStatusToast message="Uploading 1/3…" />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('fixed bottom-4 left-4');
    expect(html).toContain('Uploading 1/3…');
    expect(html).toContain('animate-spin');
  });
});
