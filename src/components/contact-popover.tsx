'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { Settings } from '@/types/domain';
import { CloseIcon, FacebookIcon, InstagramIcon, PhoneIcon } from './icons';

export type ContactSettings = Pick<Settings, 'phone' | 'facebookUrl' | 'instagramUrl'>;

interface ContactDialogContextValue {
  settings: ContactSettings;
  openDialog: (trigger?: HTMLElement | null) => void;
  closeDialog: () => void;
  isOpen: boolean;
}

const ContactDialogContext = createContext<ContactDialogContextValue | null>(null);

export function getFocusTrapTarget(
  currentIndex: number,
  focusableCount: number,
  shiftKey: boolean,
): number | null {
  if (focusableCount === 0) {
    return null;
  }

  if (shiftKey && currentIndex === 0) {
    return focusableCount - 1;
  }

  if (!shiftKey && currentIndex === focusableCount - 1) {
    return 0;
  }

  return null;
}

function getFocusableElements(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
}

interface ContactPopoverPanelProps {
  id: string;
  titleId: string;
  settings: ContactSettings;
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
  className?: string;
}

export function ContactPopoverPanel({
  id,
  titleId,
  settings,
  onClose,
  panelRef,
  className,
}: ContactPopoverPanelProps) {
  return (
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={
        className ?? 'w-80 max-w-[calc(100vw-2rem)] border border-line bg-background p-5 shadow-lg'
      }
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="font-heading text-sm tracking-[0.12em]">
          CONTACT US
        </h2>
        <button
          type="button"
          aria-label="Close contact popover"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line transition-colors hover:border-[var(--underline-color)] hover:text-[var(--underline-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-4 space-y-3 text-sm">
        <li>
          <a
            href={settings.facebookUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 transition-colors hover:text-[var(--underline-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]"
          >
            <FacebookIcon className="h-5 w-5" />
            Facebook
          </a>
        </li>
        <li>
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 transition-colors hover:text-[var(--underline-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]"
          >
            <InstagramIcon className="h-5 w-5" />
            Instagram
          </a>
        </li>
        <li>
          <a
            href={`tel:${settings.phone.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-3 transition-colors hover:text-[var(--underline-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]"
          >
            <PhoneIcon className="h-5 w-5" />
            {settings.phone}
          </a>
        </li>
      </ul>
    </div>
  );
}

export function ContactDialogProvider({
  settings,
  children,
}: {
  settings: ContactSettings;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const dialogId = useId();
  const titleId = useId();

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  const openDialog = useCallback((trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? null;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (wasOpen.current && !open) {
      triggerRef.current?.focus();
    }

    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const dialogPanel = panel;

    getFocusableElements(dialogPanel)[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements(dialogPanel);
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const targetIndex = getFocusTrapTarget(currentIndex, focusable.length, event.shiftKey);

      if (targetIndex !== null) {
        event.preventDefault();
        focusable[targetIndex]?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (dialogPanel.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <ContactDialogContext.Provider value={{ settings, openDialog, closeDialog, isOpen: open }}>
      {children}
      {open ? (
        <div className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8">
          <ContactPopoverPanel
            id={dialogId}
            titleId={titleId}
            settings={settings}
            onClose={closeDialog}
            panelRef={panelRef}
          />
        </div>
      ) : null}
    </ContactDialogContext.Provider>
  );
}

export function useContactDialog() {
  return useContext(ContactDialogContext);
}

interface ContactPopoverProps {
  settings?: ContactSettings;
  label?: string;
  triggerClassName?: string;
  panelClassName?: string;
  containerClassName?: string;
  as?: 'button' | 'link';
}

export function ContactPopover({
  settings,
  label = 'ORDER NOW',
  triggerClassName,
  panelClassName,
  containerClassName,
  as = 'button',
}: ContactPopoverProps) {
  const context = useContext(ContactDialogContext);
  const localTriggerRef = useRef<HTMLButtonElement>(null);
  const [localOpen, setLocalOpen] = useState(false);
  const localPanelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const popoverId = useId();
  const titleId = useId();

  const effectiveSettings = context?.settings ?? settings;

  // Self-contained fallback (no provider), used in isolation/tests.
  useEffect(() => {
    if (context) return;
    if (wasOpen.current && !localOpen) {
      localTriggerRef.current?.focus();
    }
    wasOpen.current = localOpen;
  }, [context, localOpen]);

  useEffect(() => {
    if (context || !localOpen) {
      return;
    }

    const panel = localPanelRef.current;
    if (!panel) {
      return;
    }

    const dialogPanel = panel;

    getFocusableElements(dialogPanel)[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setLocalOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements(dialogPanel);
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const targetIndex = getFocusTrapTarget(currentIndex, focusable.length, event.shiftKey);

      if (targetIndex !== null) {
        event.preventDefault();
        focusable[targetIndex]?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (dialogPanel.contains(target) || localTriggerRef.current?.contains(target)) {
        return;
      }
      setLocalOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [context, localOpen]);

  if (!effectiveSettings) {
    return null;
  }

  const isOpen = context ? context.isOpen : localOpen;

  function handleClick() {
    if (context) {
      context.openDialog(localTriggerRef.current);
      return;
    }
    setLocalOpen((current) => !current);
  }

  const defaultTriggerClass =
    as === 'link'
      ? 'inline-flex items-center bg-transparent p-0 text-inherit'
      : 'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--underline-color)] bg-[var(--underline-color)] px-8 font-heading text-sm tracking-[0.12em] text-white transition-colors hover:bg-background hover:text-[var(--underline-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)] sm:w-auto';

  return (
    <div className={containerClassName ?? (context ? 'contents' : 'relative')}>
      <button
        ref={localTriggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={handleClick}
        className={triggerClassName ?? defaultTriggerClass}
      >
        {label}
      </button>

      {!context && localOpen ? (
        <ContactPopoverPanel
          id={popoverId}
          titleId={titleId}
          settings={effectiveSettings}
          onClose={() => setLocalOpen(false)}
          panelRef={localPanelRef}
          className={
            panelClassName ??
            'absolute bottom-full right-0 z-30 mb-3 w-80 max-w-[calc(100vw-2rem)] border border-line bg-background p-5 shadow-lg'
          }
        />
      ) : null}
    </div>
  );
}
