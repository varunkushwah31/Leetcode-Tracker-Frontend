import { useEffect, useRef } from 'react';

interface DottedBackgroundProps {
    className?: string;
    spacing?: number;
    hoverRadius?: number;
}

export function DottedBackground({
    className = '',
    spacing = 24,
    hoverRadius = 75,
}: Readonly<DottedBackgroundProps>) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrameId: number | null = null;
        let isHovering = false;
        let isAnimating = false;
        let hoverTransition = 0; // 0 to 1 smooth fade
        let width = 0;
        let height = 0;

        const mouse = {
            currentX: -1000,
            currentY: -1000,
            targetX: -1000,
            targetY: -1000,
        };

        let isDark = document.documentElement.classList.contains('dark');

        const drawStaticFrame = () => {
            if (width === 0 || height === 0) return;
            ctx.clearRect(0, 0, width, height);

            const baseDotRadius = isDark ? 1.0 : 1.1;
            const baseDotColor = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(16, 185, 129, 0.35)';

            ctx.fillStyle = baseDotColor;
            ctx.beginPath();

            const startX = Math.floor(spacing / 2);
            const startY = Math.floor(spacing / 2);

            for (let x = startX; x < width + spacing; x += spacing) {
                for (let y = startY; y < height + spacing; y += spacing) {
                    ctx.moveTo(x + baseDotRadius, y);
                    ctx.arc(x, y, baseDotRadius, 0, Math.PI * 2);
                }
            }
            ctx.fill();
        };

        const updateSize = () => {
            if (!container || !canvas || !ctx) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = container.clientWidth;
            height = container.clientHeight;
            if (width === 0 || height === 0) return;

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            if (!isAnimating) {
                drawStaticFrame();
            }
        };

        updateSize();

        const themeObserver = new MutationObserver(() => {
            isDark = document.documentElement.classList.contains('dark');
            if (!isAnimating) {
                drawStaticFrame();
            }
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        const isOverUI = (target: Element | null): boolean => {
            if (!target) return false;
            if (target === canvas || target === container) return false;
            const uiMatch = target.closest(
                'button, a, input, select, textarea, [role="button"], [role="tab"], [role="dialog"], [role="menu"]'
            );
            return Boolean(uiMatch && uiMatch !== container && !container?.contains(uiMatch));
        };

        const prefersReducedMotion =
            typeof window.matchMedia === 'function'
                ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
                : false;

        const startAnimation = () => {
            if (isAnimating) return;
            isAnimating = true;
            animationFrameId = requestAnimationFrame(render);
        };

        const render = (timestamp: number) => {
            // Snappy mouse interpolation tightly locked to cursor
            const dx = mouse.targetX - mouse.currentX;
            const dy = mouse.targetY - mouse.currentY;
            if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
                mouse.currentX = mouse.targetX;
                mouse.currentY = mouse.targetY;
            } else {
                mouse.currentX += dx * 0.45;
                mouse.currentY += dy * 0.45;
            }

            // Smooth hover fade in/out
            if (isHovering && !prefersReducedMotion) {
                hoverTransition = Math.min(1, hoverTransition + 0.15);
            } else {
                hoverTransition = Math.max(0, hoverTransition - 0.08);
            }

            ctx.clearRect(0, 0, width, height);

            const baseDotRadius = isDark ? 1.0 : 1.1;
            const baseDotColor = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(16, 185, 129, 0.35)';
            const zoomedDotColor = isDark
                ? 'rgba(255, 255, 255, 0.85)'
                : 'rgba(16, 185, 129, 0.9)';
            const auraColor = isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(16, 185, 129, 0.18)';

            const pulse = prefersReducedMotion ? 0 : Math.sin(timestamp * 0.005) * 0.15;
            const effectiveHoverRadius = hoverRadius * hoverTransition;
            const radiusSq = effectiveHoverRadius * effectiveHoverRadius;

            const zoomedDots: Array<{
                x: number;
                y: number;
                radius: number;
            }> = [];

            ctx.fillStyle = baseDotColor;
            ctx.beginPath();

            const startX = Math.floor(spacing / 2);
            const startY = Math.floor(spacing / 2);

            for (let x = startX; x < width + spacing; x += spacing) {
                for (let y = startY; y < height + spacing; y += spacing) {
                    if (hoverTransition > 0.01) {
                        const distSq = (x - mouse.currentX) ** 2 + (y - mouse.currentY) ** 2;

                        if (distSq < radiusSq) {
                            const dist = Math.sqrt(distSq);
                            const t = 1 - dist / effectiveHoverRadius;
                            const ease = t * t * (3 - 2 * t) * hoverTransition;
                            const radius = baseDotRadius + ease * (1.1 + pulse);

                            zoomedDots.push({
                                x,
                                y,
                                radius,
                            });
                            continue;
                        }
                    }

                    // Static base dot
                    ctx.moveTo(x + baseDotRadius, y);
                    ctx.arc(x, y, baseDotRadius, 0, Math.PI * 2);
                }
            }
            ctx.fill();

            // Render zoomed dots crisply directly on exact grid points
            if (zoomedDots.length > 0) {
                // Soft aura layer
                ctx.fillStyle = auraColor;
                ctx.beginPath();
                for (const dot of zoomedDots) {
                    const auraRadius = dot.radius * 1.35;
                    ctx.moveTo(dot.x + auraRadius, dot.y);
                    ctx.arc(dot.x, dot.y, auraRadius, 0, Math.PI * 2);
                }
                ctx.fill();

                // Crisp zoomed dot core layer
                ctx.fillStyle = zoomedDotColor;
                ctx.beginPath();
                for (const dot of zoomedDots) {
                    ctx.moveTo(dot.x + dot.radius, dot.y);
                    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                }
                ctx.fill();
            }

            // Stop RAF loop when idle and hover is completely faded out
            if (!isHovering && hoverTransition <= 0) {
                isAnimating = false;
                drawStaticFrame();
                return;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;

            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!isInside) {
                if (isHovering) {
                    isHovering = false;
                    startAnimation();
                }
                return;
            }

            const target = typeof document.elementFromPoint === 'function'
                ? document.elementFromPoint(e.clientX, e.clientY)
                : null;
            if (isOverUI(target)) {
                if (isHovering) {
                    isHovering = false;
                    startAnimation();
                }
                return;
            }

            mouse.targetX = localX;
            mouse.targetY = localY;

            if (!isHovering) {
                isHovering = true;
                if (mouse.currentX < 0) {
                    mouse.currentX = localX;
                    mouse.currentY = localY;
                }
            }

            startAnimation();
        };

        const handleMouseLeave = () => {
            isHovering = false;
            startAnimation();
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateSize)
            : null;
        if (resizeObserver && container) {
            resizeObserver.observe(container);
        }

        // Initial draw and initial animation kickstart
        startAnimation();

        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (resizeObserver) resizeObserver.disconnect();
            themeObserver.disconnect();
        };
    }, [spacing, hoverRadius]);

    return (
        <div
            ref={containerRef}
            className={`pointer-events-none absolute inset-0 overflow-hidden z-0 ${className}`}
            aria-hidden="true"
        >
            <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
            <noscript>
                <div className="absolute inset-0 bg-[radial-gradient(rgba(50,205,50,0.6)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[24px_24px] bg-fixed" />
            </noscript>
        </div>
    );
}
