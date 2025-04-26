import React from 'react';

interface IconProps {
    name: string;
    size?: number;
    className?: string;
    color?: string;
    onClick?: () => void;
    ariaLabel?: string;
}

/**
 * Composant Icon qui utilise le système de sprites SVG
 * Toutes les icônes sont regroupées dans un seul fichier pour réduire les requêtes HTTP
 */
export const Icon = ({
    name,
    size = 24,
    className = '',
    color,
    onClick,
    ariaLabel,
}: IconProps) => {
    return (
        <svg
            width={size}
            height={size}
            className={className}
            style={{ color }}
            onClick={onClick}
            aria-label={ariaLabel}
            role={onClick ? 'button' : undefined}
            aria-hidden={!ariaLabel}
            tabIndex={onClick ? 0 : undefined}
        >
            <use href={`/sprites.svg#icon-${name}`} />
        </svg>
    );
};

export default Icon; 