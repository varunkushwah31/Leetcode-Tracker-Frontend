import { useEffect, useRef } from 'react';

interface DottedBackgroundProps {
    className?: string;
    spacing?: number;
    hoverRadius?: number;
}

export function DottedBackground({
    className = '',
    spacing = 24,
    hoverRadius = 180,
}: Readonly<DottedBackgroundProps>) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

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
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
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

        const handleMouseMove = (e: MouseEvent) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
            if (!isHovering) {
                isHovering = true;
                if (mouse.currentX < 0) {
                    mouse.currentX = e.clientX;
                    mouse.currentY = e.clientY;
                }
            }
        };

        const handleMouseLeave = () => {
            isHovering = false;
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
        window.addEventListener('resize', updateSize, { passive: true });

        const prefersReducedMotion =
            typeof window.matchMedia === 'function'
                ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
                : false;

        const render = (timestamp: number) => {
            // Smooth mouse interpolation (spring glide)
            mouse.currentX += (mouse.targetX - mouse.currentX) * 0.18;
            mouse.currentY += (mouse.targetY - mouse.currentY) * 0.18;

            // Smooth hover transition in/out
            if (isHovering && !prefersReducedMotion) {
                hoverTransition = Math.min(1, hoverTransition + 0.08);
            } else {
                hoverTransition = Math.max(0, hoverTransition - 0.05);
            }

            ctx.clearRect(0, 0, width, height);

            // Styling parameters based on theme
            const baseDotRadius = isDark ? 1.0 : 1.1;
            const baseDotColor = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(16, 185, 129, 0.45)';
            const zoomedDotColor = isDark
                ? 'rgba(255, 255, 255, 0.75)'
                : 'rgba(16, 185, 129, 0.95)';
            const glowColor = isDark
                ? 'rgba(110, 231, 183, 0.22)'
                : 'rgba(5, 150, 105, 0.28)';

            // Subtle breathing pulse wave for zoomed dots while hovering
            const pulse = prefersReducedMotion ? 0 : Math.sin(timestamp * 0.005) * 0.35;
            const effectiveHoverRadius = hoverRadius * hoverTransition;

            // Separate base stationary dots from active zoomed dots for performance
            const zoomedDots: Array<{
                x: number;
                y: number;
                radius: number;
                ease: number;
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
                            // Smoothstep cubic interpolation
                            const ease = t * t * (3 - 2 * t) * hoverTransition;

                            // Gentle lens magnification displacement
                            const lensPush = ease * 3.5;
                            const renderX = dist > 0.01 ? x + (dx / dist) * lensPush : x;
                            const renderY = dist > 0.01 ? y + (dy / dist) * lensPush : y;
                            const radius = baseDotRadius + ease * (2.0 + pulse);

                            zoomedDots.push({
                                x: renderX,
                                y: renderY,
                                radius,
                                ease,
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

            // Render zoomed dots with luminous aura and enhanced contrast
            if (zoomedDots.length > 0) {
                // Soft glow halo layer for zoomed dots
                ctx.fillStyle = glowColor;
                ctx.beginPath();
                for (const dot of zoomedDots) {
                    const glowRadius = dot.radius * 2.2;
                    ctx.moveTo(dot.x + glowRadius, dot.y);
                    ctx.arc(dot.x, dot.y, glowRadius, 0, Math.PI * 2);
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
            window.removeEventListener('resize', updateSize);
            themeObserver.disconnect();
        };
    }, [spacing, hoverRadius]);

    return (
        <div
            className={`pointer-events-none fixed inset-0 overflow-hidden z-0 transition-opacity duration-500 ${className}`}
            aria-hidden="true"
        >
            <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
            <noscript>
                <div className="absolute inset-0 bg-[radial-gradient(rgba(50,205,50,0.6)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[24px_24px] bg-fixed" />
            </noscript>
        </div>
    );
}
