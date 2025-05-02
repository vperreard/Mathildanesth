import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
    children: React.ReactElement;
    content: React.ReactNode;
    position?: TooltipPosition;
    delay?: number;
    className?: string;
    arrow?: boolean;
    maxWidth?: number | string;
    disabled?: boolean;
    interactive?: boolean;
}

/**
 * Composant Tooltip pour afficher des informations supplémentaires au survol
 */
export const Tooltip: React.FC<TooltipProps> = ({
    children,
    content,
    position = 'top',
    delay = 300,
    className = '',
    arrow = true,
    maxWidth = 250,
    disabled = false,
    interactive = false
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Calcul de la position du tooltip en fonction de l'élément déclencheur
    const calculatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;

        let x = 0, y = 0;

        switch (position) {
            case 'top':
                x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollX;
                y = triggerRect.top - tooltipRect.height - 10 + scrollY;
                break;
            case 'right':
                x = triggerRect.right + 10 + scrollX;
                y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2) + scrollY;
                break;
            case 'bottom':
                x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollX;
                y = triggerRect.bottom + 10 + scrollY;
                break;
            case 'left':
                x = triggerRect.left - tooltipRect.width - 10 + scrollX;
                y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2) + scrollY;
                break;
        }

        // Ajustements pour éviter que le tooltip ne sorte de l'écran
        const padding = 10;
        if (x < padding) x = padding;
        if (x + tooltipRect.width > window.innerWidth - padding) {
            x = window.innerWidth - tooltipRect.width - padding;
        }
        if (y < padding) y = padding;
        if (y + tooltipRect.height > window.innerHeight - padding) {
            y = window.innerHeight - tooltipRect.height - padding;
        }

        setTooltipPosition({ x, y });
    };

    // Afficher le tooltip
    const showTooltip = () => {
        if (disabled) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            // Calculer la position après que le tooltip soit visible
            setTimeout(calculatePosition, 0);
        }, delay);
    };

    // Masquer le tooltip
    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (!interactive) {
            setIsVisible(false);
        }
    };

    // Masquer le tooltip même en mode interactif
    const forceHideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    // Recalculer la position lors du scroll ou du redimensionnement
    useEffect(() => {
        if (isVisible) {
            const handleResize = () => calculatePosition();
            const handleScroll = () => calculatePosition();

            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleScroll);

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('scroll', handleScroll);
            };
        }
    }, [isVisible]);

    // Nettoyer le timeout à la suppression du composant
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Classes pour le positionnement de la flèche
    const arrowClass = {
        top: 'after:top-full after:left-1/2 after:-ml-1 after:border-t-gray-800',
        right: 'after:top-1/2 after:right-full after:-mt-1 after:border-r-gray-800',
        bottom: 'after:bottom-full after:left-1/2 after:-ml-1 after:border-b-gray-800',
        left: 'after:top-1/2 after:left-full after:-mt-1 after:border-l-gray-800'
    }[position];

    // Rendu du tooltip
    const renderTooltip = () => {
        if (!isVisible) return null;

        return createPortal(
            <div
                ref={tooltipRef}
                className={`fixed z-50 p-2 text-sm text-white bg-gray-800 rounded shadow-lg transform -translate-x-1/2 opacity-0 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'
                    } ${className} ${interactive ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                style={{
                    left: `${tooltipPosition.x}px`,
                    top: `${tooltipPosition.y}px`,
                    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth
                }}
                onMouseEnter={interactive ? showTooltip : undefined}
                onMouseLeave={interactive ? forceHideTooltip : undefined}
            >
                {arrow && (
                    <div
                        className={`absolute w-0 h-0 border-transparent border-solid ${arrowClass} after:border-4`}
                    />
                )}
                {content}
            </div>,
            document.body
        );
    };

    // Cloner l'élément enfant pour ajouter les gestionnaires d'événements
    const enhancedChildren = React.cloneElement(children, {
        onMouseEnter: (e: React.MouseEvent) => {
            showTooltip();
            // Appeler le onMouseEnter original s'il existe
            if (children.props.onMouseEnter) {
                children.props.onMouseEnter(e);
            }
        },
        onMouseLeave: (e: React.MouseEvent) => {
            hideTooltip();
            // Appeler le onMouseLeave original s'il existe
            if (children.props.onMouseLeave) {
                children.props.onMouseLeave(e);
            }
        },
        onFocus: (e: React.FocusEvent) => {
            showTooltip();
            // Appeler le onFocus original s'il existe
            if (children.props.onFocus) {
                children.props.onFocus(e);
            }
        },
        onBlur: (e: React.FocusEvent) => {
            hideTooltip();
            // Appeler le onBlur original s'il existe
            if (children.props.onBlur) {
                children.props.onBlur(e);
            }
        }
    });

    return (
        <div ref={triggerRef} className="inline-block">
            {enhancedChildren}
            {renderTooltip()}
        </div>
    );
};

/**
 * Composant TooltipIcon affichant une icône d'information avec un tooltip
 */
export const TooltipIcon: React.FC<{ content: React.ReactNode; className?: string }> = ({
    content,
    className = ''
}) => (
    <Tooltip content={content} position="top">
        <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 cursor-help hover:bg-gray-300 ml-1 ${className}`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        </div>
    </Tooltip>
);

/**
 * Composant HelpTooltip pour fournir de l'aide contextuelle
 */
export const HelpTooltip: React.FC<{ content: React.ReactNode }> = ({ content }) => (
    <Tooltip content={content} position="top" interactive>
        <button type="button" className="text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
        </button>
    </Tooltip>
);

export default Tooltip; 