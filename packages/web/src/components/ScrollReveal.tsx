import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    distance?: string;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    variant?: 'fade' | 'zoom' | 'blur' | 'tilt';
}

export default function ScrollReveal({
    children,
    className = '',
    delay = 0,
    duration = 500,
    distance = '20px',
    direction = 'right',
    variant = 'fade',
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!window.IntersectionObserver || prefersReducedMotion) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.05,
                rootMargin: '0px 0px -40px 0px',
            },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    const getInitialStyles = () => {
        const trans = (() => {
            switch (direction) {
                case 'up':
                    return `translateY(${distance})`;
                case 'down':
                    return `translateY(-${distance})`;
                case 'left':
                    return `translateX(${distance})`;
                case 'right':
                    return `translateX(-${distance})`;
                case 'none':
                default:
                    return '';
            }
        })();

        switch (variant) {
            case 'zoom':
                return {
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'scale(1) translate(0, 0)' : `scale(0.96) ${trans}`.trim(),
                };
            case 'blur':
                return {
                    opacity: isVisible ? 1 : 0,
                    filter: isVisible ? 'blur(0px)' : 'blur(8px)',
                    transform: isVisible ? 'scale(1) translate(0, 0)' : `scale(0.98) ${trans}`.trim(),
                };
            case 'tilt':
                return {
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                        ? 'perspective(1000px) rotateX(0deg) translateY(0)'
                        : `perspective(1000px) rotateX(10deg) translateY(${distance})`,
                };
            case 'fade':
            default:
                return {
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translate(0, 0)' : trans || 'none',
                };
        }
    };

    return (
        <div
            ref={ref}
            style={{
                ...getInitialStyles(),
                transitionProperty: 'opacity, transform, filter',
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay}ms`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className={`overflow-x-clip ${className}`}
        >
            {children}
        </div>
    );
}
