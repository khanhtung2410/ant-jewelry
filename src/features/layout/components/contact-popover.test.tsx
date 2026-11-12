import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ContactPopover, ContactPopoverPanel, getFocusTrapTarget } from './contact-popover';

const settings = {
  siteName: 'ANT JEWELRY',
  phone: '0900 000 000',
  facebookUrl: 'https://www.facebook.com/example.antjewelry',
  instagramUrl: 'https://www.instagram.com/example.antjewelry',
};

describe('ContactPopover', () => {
  it('renders a closed ORDER NOW trigger', () => {
    const html = renderToStaticMarkup(<ContactPopover settings={settings} />);

    expect(html).toContain('ORDER NOW');
    expect(html).toContain('bg-[var(--underline-color)]');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('CONTACT US');
  });

  it('uses the supplied class for a navigation-style trigger', () => {
    const html = renderToStaticMarkup(
      <ContactPopover settings={settings} label="CONTACT" triggerClassName="nav-contact-link" />,
    );

    expect(html).toContain('class="nav-contact-link"');
    expect(html).toContain('CONTACT</button>');
  });

  it('renders the dialog with contact links when the panel is open', () => {
    const html = renderToStaticMarkup(
      <ContactPopoverPanel
        id="contact-popover"
        titleId="contact-title"
        settings={settings}
        onClose={vi.fn()}
        panelRef={createRef<HTMLDivElement>()}
      />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="contact-title"');
    expect(html).toContain('CONTACT US');
    expect(html).toContain('aria-label="Close contact popover"');
    expect(html).toContain('href="https://www.facebook.com/example.antjewelry"');
    expect(html).toContain('href="https://www.instagram.com/example.antjewelry"');
    expect(html).toContain('href="tel:0900000000"');
    expect(html).toContain('0900 000 000');
    expect(html).toContain('ANT JEWELRY');
    expect(html).toContain('hover:border-red-800');
    expect(html).toContain('rounded-3xl');
  });
});

describe('getFocusTrapTarget', () => {
  it('loops Tab from the last item to the first item', () => {
    expect(getFocusTrapTarget(2, 3, false)).toBe(0);
    expect(getFocusTrapTarget(1, 3, false)).toBeNull();
  });

  it('loops Shift+Tab from the first item to the last item', () => {
    expect(getFocusTrapTarget(0, 3, true)).toBe(2);
    expect(getFocusTrapTarget(1, 3, true)).toBeNull();
  });

  it('does nothing when there is nothing focusable', () => {
    expect(getFocusTrapTarget(0, 0, false)).toBeNull();
  });
});
