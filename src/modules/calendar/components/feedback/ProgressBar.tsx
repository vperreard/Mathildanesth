import React from 'react';

interface ProgressBarProps {
    progress: number; // 0 à 100
    color?: 'primary' | 'success' | 'warning' | 'error';
    height?: number;
    showPercentage?: boolean;
    label?: string;
    className?: string;
    animated?: boolean;
    striped?: boolean;
}

/**
 * Composant ProgressBar pour afficher la progression des opérations longues
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color = 'primary',
    height = 8,
    showPercentage = false,
    label,
    className = '',
    animated = true,
    striped = false
}) => {
    // Assurer que progress est entre 0 et 100
    const clampedProgress = Math.max(0, Math.min(100, progress));

    // Définir les classes de couleur
    const colorClasses = {
        primary: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-500',
        error: 'bg-red-600'
    }[color];

    // Classes pour la barre de progression
    const progressClasses = [
        colorClasses,
        animated ? 'transition-all duration-500 ease-out' : '',
        striped ? 'progress-bar-striped' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={`progress-bar-container ${className}`}>
            {label && (
                <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700">{label}</span>
                    {showPercentage && (
                        <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
                    )}
                </div>
            )}
            <div
                className="w-full bg-gray-200 rounded-full overflow-hidden"
                style={{ height: `${height}px` }}
                role="progressbar"
                aria-valuenow={clampedProgress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={progressClasses}
                    style={{ width: `${clampedProgress}%`, height: '100%' }}
                />
            </div>
            {!label && showPercentage && (
                <div className="text-right mt-1">
                    <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
                </div>
            )}

            {/* Styles pour la version striped */}
            {striped && (
                <style jsx global>{`
          .progress-bar-striped {
            background-image: linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.15) 25%,
              transparent 25%,
              transparent 50%,
              rgba(255, 255, 255, 0.15) 50%,
              rgba(255, 255, 255, 0.15) 75%,
              transparent 75%,
              transparent
            );
            background-size: 1rem 1rem;
          }
        `}</style>
            )}
        </div>
    );
};

/**
 * Composant d'indicateur de progression pour l'importation des données
 */
export const ImportProgress: React.FC<{ progress: number; total: number; isError?: boolean }> = ({
    progress,
    total,
    isError = false
}) => {
    const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

    return (
        <div className="p-4 bg-white rounded-md shadow-sm">
            <div className="flex justify-between mb-2">
                <span className="font-medium">Importation des données</span>
                <span className="text-sm text-gray-500">{progress} / {total}</span>
            </div>
            <ProgressBar
                progress={percentage}
                color={isError ? 'error' : percentage === 100 ? 'success' : 'primary'}
                height={10}
                striped
                animated
            />
            {isError && (
                <div className="mt-2 text-sm text-red-600">
                    Erreur lors de l'importation. Veuillez réessayer.
                </div>
            )}
        </div>
    );
};

/**
 * Composant pour l'enregistrement des opérations
 */
export const OperationSaveProgress: React.FC<{
    step: number;
    totalSteps: number;
    currentTask: string;
}> = ({
    step,
    totalSteps,
    currentTask
}) => {
        const percentage = (step / totalSteps) * 100;

        return (
            <div className="p-4 bg-white rounded-md shadow-sm">
                <div className="mb-2">
                    <div className="font-medium">Enregistrement en cours</div>
                    <div className="text-sm text-gray-600">Étape {step} sur {totalSteps}</div>
                </div>
                <ProgressBar
                    progress={percentage}
                    color="primary"
                    height={8}
                    striped
                    animated
                />
                <div className="mt-2 text-sm text-gray-700">{currentTask}</div>
            </div>
        );
    };

export default ProgressBar; 