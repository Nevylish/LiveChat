import { ExternalLink, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        setIsMobile(mql.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [breakpoint]);
    return isMobile;
}

interface VideoModalProps {
    open: boolean;
    onClose: () => void;
    videoId: string;
    title: string;
}

export default function VideoModal({ open, onClose, videoId, title }: VideoModalProps) {
    const isMobile = useIsMobile();
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

    // Mobile: full-viewport overlay with centered 16:9 video
    if (isMobile) {
        return (
            <div className="fixed inset-0 z-70 flex flex-col items-center justify-center bg-black">
                <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                    <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir sur YouTube
                    </a>
                    <button
                        onClick={onClose}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                        aria-label="Fermer la vidéo"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                        src={embedUrl}
                        title={title}
                        allow="autoplay; fullscreen; encrypted-media"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                    />
                </div>
            </div>
        );
    }

    // Desktop: centered modal with backdrop
    return (
        <div
            ref={overlayRef}
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            style={{ animation: 'videoModalFadeIn 0.2s ease-out' }}
        >
            <div className="relative w-full max-w-6xl px-4" style={{ animation: 'videoModalScaleIn 0.25s ease-out' }}>
                <div className="absolute -top-12 right-4 flex items-center gap-2">
                    <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir sur YouTube
                    </a>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Fermer la vidéo"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            src={embedUrl}
                            title={title}
                            allow="autoplay; fullscreen; encrypted-media"
                            allowFullScreen
                            className="absolute inset-0 h-full w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
