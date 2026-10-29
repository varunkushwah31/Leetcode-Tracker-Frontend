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

        let animationFrameId: number;
        let isHovering = false;
        let hoverTransition = 0; // 0 to 1 smooth fade
        let width = 0;
        let height = 0;

        const mouse = {
            currentX: -1000,
            currentY: -1000,
            targetX: -1000,
            targetY: -1000,
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
        };

        updateSize();

        let isDark = document.documentElement.classList.contains('dark');
        const themeObserver = new MutationObserver(() => {
            isDark = document.documentElement.classList.contains('dark');
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        const isOverUI = (target: Element | null): boolean => {
            if (!target) return false;
            if (target === canvas || target === container) return false;
            const uiMatch = target.closest(
                'button, a, input, select, textarea, [role="button"], [role="tab"], [role="dialog"], [role="menu"], header, nav, footer, [data-slot], [data-card], .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-lg, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl, .border-zinc-200, .dark\\:border-zinc-800, .bg-white, .dark\\:bg-zinc-900, .dark\\:bg-\\[\\#111111\\], .dark\\:bg-\\[\\#1a1a1a\\], .dark\\:bg-\\[\\#18181b\\], .dark\\:bg-\\[\\#141414\\]'
            );
            return Boolean(uiMatch && uiMatch !== container && !container?.contains(uiMatch));
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!isInside) {
                isHovering = false;
                return;
            }

            const target = typeof document.elementFromPoint === 'function'
                ? document.elementFromPoint(e.clientX, e.clientY)
                : null;
            if (isOverUI(target)) {
                isHovering = false;
                return;
            }

            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;

            mouse.targetX = localX;
            mouse.targetY = localY;
            if (!isHovering) {
                isHovering = true;
                if (mouse.currentX < 0) {
                    mouse.currentX = localX;
                    mouse.currentY = localY;
                }
            }
        };

        const handleMouseLeave = () => {
            isHovering = false;
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateSize)
            : null;
        if (resizeObserver && container) {
            resizeObserver.observe(container);
        }

        const prefersReducedMotion =
            typeof window.matchMedia === 'function'
                ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
                : false;

        const render = (timestamp: number) => {
            // Smooth mouse interpolation (spring glide)
            mouse.currentX += (mouse.targetX - mouse.currentX) * 0.22;
            mouse.currentY += (mouse.targetY - mouse.currentY) * 0.22;

            // Smooth hover transition in/out
            if (isHovering && !prefersReducedMotion) {
                hoverTransition = Math.min(1, hoverTransition + 0.12);
            } else {
                hoverTransition = Math.max(0, hoverTransition - 0.08);
            }

            ctx.clearRect(0, 0, width, height);

            // Styling parameters based on theme
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

            // Subtle breathing pulse wave for zoomed dots while hovering
            const pulse = prefersReducedMotion ? 0 : Math.sin(timestamp * 0.005) * 0.15;
            const effectiveHoverRadius = hoverRadius * hoverTransition;

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
                        const dx = x - mouse.currentX;
                        const dy = y - mouse.currentY;
                        const distSq = dx * dx + dy * dy;

                        if (distSq < effectiveHoverRadius * effectiveHoverRadius) {
                            const dist = Math.sqrt(distSq);
                            const t = 1 - dist / effectiveHoverRadius;
                            // Cubic smoothstep for tight, focused falloff
                            const ease = t * t * (3 - 2 * t) * hoverTransition;
                            // Clean zoom (dots stay firmly on grid coordinates)
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

            // Render zoomed dots crisply without thick halo rings
            if (zoomedDots.length > 0) {
                // Subtle soft aura layer
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

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
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
