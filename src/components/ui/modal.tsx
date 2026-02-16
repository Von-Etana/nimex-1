import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className,
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={cn(
                    "relative bg-white rounded-xl shadow-xl w-full max-w-lg transform transition-all flex flex-col max-h-[90vh] animate-scale-up",
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-neutral-100">
                    <h3 className="font-heading font-bold text-lg md:text-xl text-neutral-900">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 md:p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
