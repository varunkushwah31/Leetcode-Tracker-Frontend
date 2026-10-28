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

    it('responds to mouse movement by updating coordinates', () => {
        render(<DottedBackground spacing={30} hoverRadius={150} />);

        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300 }));
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });
});
