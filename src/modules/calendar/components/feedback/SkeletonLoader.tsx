import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    count?: number;
    inline?: boolean;
}

/**
 * Composant SkeletonLoader pour afficher un placeholder animé pendant le chargement
 */
export const SkeletonLoader: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    className = '',
    count = 1,
    inline = false
}) => {
    const baseStyle: React.CSSProperties = {
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        marginBottom: inline ? 0 : '8px',
        display: inline ? 'inline-block' : 'block',
        marginRight: inline ? '8px' : '0'
    };

    return (
        <div className={`skeleton-loader ${className}`}>
            <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} style={baseStyle} className="skeleton-item" data-testid="skeleton-loader" />
            ))}
        </div>
    );
};

/**
 * SkeletonCalendarDay - Squelette pour un jour de calendrier
 */
export const SkeletonCalendarDay: React.FC = () => (
    <div className="p-2">
        <SkeletonLoader height="24px" width="24px" borderRadius="50%" className="mb-2" />
        <SkeletonLoader height="12px" count={2} className="mb-1" />
    </div>
);

/**
 * SkeletonCalendarEvent - Squelette pour un événement de calendrier
 */
export const SkeletonCalendarEvent: React.FC = () => (
    <div className="rounded p-2 mb-2">
        <SkeletonLoader height="18px" className="mb-1" />
        <SkeletonLoader height="14px" width="70%" />
    </div>
);

/**
 * SkeletonCalendarHeader - Squelette pour l'en-tête du calendrier
 */
export const SkeletonCalendarHeader: React.FC = () => (
    <div className="flex items-center justify-between p-2">
        <div className="flex items-center">
            <SkeletonLoader width="40px" height="40px" borderRadius="50%" />
            <SkeletonLoader width="120px" height="24px" className="ml-2" />
        </div>
        <div className="flex">
            <SkeletonLoader width="80px" height="32px" className="mr-2" />
            <SkeletonLoader width="80px" height="32px" />
        </div>
    </div>
);

/**
 * SkeletonOperationRoomSchedule - Squelette pour la planification du bloc opératoire
 */
export const SkeletonOperationRoomSchedule: React.FC = () => (
    <div>
        <SkeletonCalendarHeader />
        <div className="mt-4">
            <SkeletonLoader height="40px" className="mb-4" />
            <div className="flex mb-3">
                <SkeletonLoader width="120px" height="24px" className="mr-2" />
                <div className="flex-1">
                    <SkeletonLoader height="24px" />
                </div>
            </div>
            <div className="flex mb-3">
                <SkeletonLoader width="120px" height="24px" className="mr-2" />
                <div className="flex-1">
                    <SkeletonLoader height="24px" />
                </div>
            </div>
            <div className="flex mb-3">
                <SkeletonLoader width="120px" height="24px" className="mr-2" />
                <div className="flex-1">
                    <SkeletonLoader height="24px" />
                </div>
            </div>
        </div>
    </div>
);

export default SkeletonLoader; 