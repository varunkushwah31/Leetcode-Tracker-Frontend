import { useEffect, type RefObject } from 'react';

interface UseKeyboardScrollOptions {
    targetRef?: RefObject<HTMLElement | null>;
    step?: number;
    enabled?: boolean;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return true;
    }
    if (target.isContentEditable) {
        return true;
    }
    const role = target.getAttribute('role');
    if (role === 'textbox' || role === 'combobox' || role === 'searchbox') {
        return true;
    }
    return false;
};

export function useKeyboardScroll({
    targetRef,
    step = 90,
    enabled = true,
}: UseKeyboardScrollOptions = {}) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Never interfere with modifier shortcuts (Ctrl+C, Alt+Left, etc.)
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            // Do not intercept if user is typing in an input, textarea, or contentEditable element
            if (isEditableTarget(e.target) || isEditableTarget(document.activeElement)) {
                return;
            }

            const key = e.key;
            const isScrollKey =
                key === 'ArrowDown' ||
                key === 'ArrowUp' ||
                key === 'PageDown' ||
                key === 'PageUp' ||
                key === 'Home' ||
                key === 'End' ||
                key === ' ' ||
                key === 'Spacebar';

            if (!isScrollKey) return;

            // If user has focused a button or link with keyboard, let Space activate it
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if ((key === ' ' || key === 'Spacebar') && (activeTag === 'button' || activeTag === 'a')) {
                return;
            }

            // Determine scroll container
            let scrollEl: HTMLElement | Window | null = null;
            const dialog = document.querySelector('[role="dialog"], [data-slot="dialog-content"]');

            if (dialog instanceof HTMLElement) {
                if (dialog.scrollHeight > dialog.clientHeight) {
                    scrollEl = dialog;
                } else {
                    const scrollableChild = dialog.querySelector<HTMLElement>('.overflow-y-auto');
                    if (scrollableChild && scrollableChild.scrollHeight > scrollableChild.clientHeight) {
                        scrollEl = scrollableChild;
                    } else {
                        scrollEl = dialog;
                    }
                }
            } else if (targetRef?.current) {
                scrollEl = targetRef.current;
            } else {
                scrollEl = window;
            }

            if (!scrollEl) return;

            const isWindow = scrollEl === window;
            let delta = 0;
            let scrollToTop: number | null = null;

            // Only compute heavy layout geometry (scrollHeight, clientHeight) when Page/Space/Home/End is pressed
            if (key === 'ArrowDown') {
                delta = step;
            } else if (key === 'ArrowUp') {
                delta = -step;
            } else if (key === 'Home') {
                scrollToTop = 0;
            } else {
                const clientHeight = isWindow ? window.innerHeight : (scrollEl as HTMLElement).clientHeight;
                const scrollHeight = isWindow
                    ? Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
                    : (scrollEl as HTMLElement).scrollHeight;
                const pageStep = Math.max(250, Math.floor(clientHeight * 0.75));

                switch (key) {
                    case 'PageDown':
                        delta = pageStep;
                        break;
                    case 'PageUp':
                        delta = -pageStep;
                        break;
                    case ' ':
                    case 'Spacebar':
                        delta = e.shiftKey ? -pageStep : pageStep;
                        break;
                    case 'End':
                        scrollToTop = scrollHeight;
                        break;
                    default:
                        return;
                }
            }

            e.preventDefault();

            // When holding down arrow keys (e.repeat is true), use 'auto' behavior to prevent animation queuing
            const behavior: ScrollBehavior = (key === 'ArrowDown' || key === 'ArrowUp') && e.repeat ? 'auto' : 'smooth';

            if (scrollToTop !== null) {
                if (isWindow) {
                    window.scrollTo({ top: scrollToTop, behavior });
                } else {
                    (scrollEl as HTMLElement).scrollTo({ top: scrollToTop, behavior });
                }
            } else if (delta !== 0) {
                if (isWindow) {
                    window.scrollBy({ top: delta, behavior });
                } else {
                    (scrollEl as HTMLElement).scrollBy({ top: delta, behavior });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, { passive: false });
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [targetRef, step, enabled]);
}
