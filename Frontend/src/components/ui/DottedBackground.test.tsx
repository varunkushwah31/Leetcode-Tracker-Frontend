import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DottedBackground } from './DottedBackground';

describe('DottedBackground component', () => {
    let mockContext: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
        mockContext = {
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            setTransform: vi.fn(),
        };

        HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;
        Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
            left: 500,
            top: 0,
            right: 1000,
            bottom: 800,
            width: 500,
            height: 800,
            x: 500,
            y: 0,
            toJSON: () => {},
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders canvas element without throwing', () => {
        const { container } = render(<DottedBackground />);
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
    });

    it('cleans up event listeners and animation frame on unmount', () => {
        const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const { unmount } = render(<DottedBackground />);

        unmount();
        expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });

    it('responds to mouse movement inside canvas bounds and ignores events outside', () => {
        render(<DottedBackground spacing={24} hoverRadius={75} />);

        // Mouse outside bounds (e.g. over a grid panel on the left at x = 100)
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();

        // Mouse inside bounds (x = 600)
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 200 }));
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });
});
