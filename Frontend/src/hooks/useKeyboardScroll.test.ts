import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardScroll } from './useKeyboardScroll';

describe('useKeyboardScroll hook', () => {
    let scrollBySpy: ReturnType<typeof vi.fn>;
    let scrollToSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        scrollBySpy = vi.fn();
        scrollToSpy = vi.fn();
        window.scrollBy = scrollBySpy as unknown as typeof window.scrollBy;
        window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('scrolls down on ArrowDown and up on ArrowUp', () => {
        renderHook(() => useKeyboardScroll({ step: 100 }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
        expect(scrollBySpy).toHaveBeenCalledWith({ top: 100, behavior: 'smooth' });

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
        expect(scrollBySpy).toHaveBeenCalledWith({ top: -100, behavior: 'smooth' });
    });

    it('uses auto behavior when key is repeating (held down)', () => {
        renderHook(() => useKeyboardScroll({ step: 100 }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', repeat: true, cancelable: true }));
        expect(scrollBySpy).toHaveBeenCalledWith({ top: 100, behavior: 'auto' });
    });

    it('scrolls to top on Home and bottom on End', () => {
        renderHook(() => useKeyboardScroll());

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', cancelable: true }));
        expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ top: 0, behavior: 'smooth' }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', cancelable: true }));
        expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    });

    it('does not scroll when user is typing in an input element', () => {
        renderHook(() => useKeyboardScroll());

        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();

        const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
        Object.defineProperty(event, 'target', { value: input });
        window.dispatchEvent(event);

        expect(scrollBySpy).not.toHaveBeenCalled();
        document.body.removeChild(input);
    });

    it('does not intercept when modifier keys are pressed', () => {
        renderHook(() => useKeyboardScroll());

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, cancelable: true }));
        expect(scrollBySpy).not.toHaveBeenCalled();

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, cancelable: true }));
        expect(scrollBySpy).not.toHaveBeenCalled();

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', metaKey: true, cancelable: true }));
        expect(scrollBySpy).not.toHaveBeenCalled();
    });

    it('scrolls custom targetRef element when provided', () => {
        const target = document.createElement('div');
        const customScrollBy = vi.fn();
        target.scrollBy = customScrollBy as unknown as typeof target.scrollBy;
        document.body.appendChild(target);

        const targetRef = { current: target };
        renderHook(() => useKeyboardScroll({ targetRef, step: 80 }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
        expect(customScrollBy).toHaveBeenCalledWith({ top: 80, behavior: 'smooth' });
        expect(scrollBySpy).not.toHaveBeenCalled();

        document.body.removeChild(target);
    });
});
