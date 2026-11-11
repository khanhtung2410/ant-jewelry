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
import type { Settings } from '@/features/shared/domain/domain';
import { CloseButton } from './close-button';
import { FacebookIcon, InstagramIcon, PhoneIcon } from './icons';
import { ActionButton } from './action-button';

export type ContactSettings = Pick<Settings, 'phone' | 'facebookUrl' | 'instagramUrl'>;

const dialogBackdropClass = 'fixed inset-0 z-[60] grid place-items-center bg-black/10 p-4';
const dialogPanelClass =
  'relative flex h-auto w-[215px] flex-col overflow-hidden rounded-3xl bg-background px-4 pb-6 pt-4 shadow-[0_8px_24px_rgba(0,0,0,0.28)]';

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
      className={className ?? dialogPanelClass}
    >
      <div className="relative mb-4 flex items-start justify-center">
        <h2
          id={titleId}
          className="m-0 w-full text-center font-heading text-[15px] font-semibold tracking-wider text-[var(--font-color)]"
        >
          CONTACT US
        </h2>
        <CloseButton
          ariaLabel="Close contact popover"
          onClick={onClose}
          className="absolute right-0 top-0 !h-5 !w-5 !border [&>svg]:h-3 [&>svg]:w-3"
        />
      </div>

      <div className="flex flex-col gap-2 text-[14px] text-[#265649]">
        <a
          href={settings.facebookUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 text-[14px] text-[#265649] transition-colors hover:text-[var(--font-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]"
        >
          <FacebookIcon className="box-border h-8 w-8 shrink-0 overflow-visible rounded-full border border-black p-1.5 text-black" />
          <span>ANT JEWELRY</span>
        </a>

        <a
          href={settings.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 text-[14px] text-[#265649] transition-colors hover:text-[var(--font-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]"
        >
          <InstagramIcon className="box-border h-8 w-8 shrink-0 overflow-visible rounded-full border border-black p-1.5 text-black" />
          <span>ANT JEWELRY</span>
        </a>

        <a
          href={`tel:${settings.phone.replace(/\s+/g, '')}`}
          className="flex items-center gap-3 text-[14px] text-[#265649] transition-colors hover:text-[var(--font-color)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]"
        >
          <PhoneIcon className="box-border h-8 w-8 shrink-0 overflow-visible rounded-full border border-black p-1.5 text-black [&_path]:origin-center [&_path]:scale-[0.8]" />
          <span>{settings.phone}</span>
        </a>
      </div>
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
        <div className={dialogBackdropClass}>
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
}

export function ContactPopover({
  settings,
  label = 'ORDER NOW',
  triggerClassName,
  panelClassName,
  containerClassName,
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

  const triggerProps = {
    ref: localTriggerRef,
    type: 'button' as const,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? popoverId : undefined,
    onClick: handleClick,
  };

  return (
    <div className={containerClassName ?? (context ? 'contents' : 'relative')}>
      {triggerClassName ? (
        <button {...triggerProps} className={triggerClassName}>
          {label}
        </button>
      ) : (
        <ActionButton {...triggerProps}>{label}</ActionButton>
      )}

      {!context && localOpen ? (
        <div className={dialogBackdropClass}>
          <ContactPopoverPanel
            id={popoverId}
            titleId={titleId}
            settings={effectiveSettings}
            onClose={() => setLocalOpen(false)}
            panelRef={localPanelRef}
            className={panelClassName}
          />
        </div>
      ) : null}
    </div>
  );
}
