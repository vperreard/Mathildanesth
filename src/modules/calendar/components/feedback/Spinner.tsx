import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'secondary' | 'white';
    label?: string;
    fullScreen?: boolean;
    overlay?: boolean;
    className?: string;
}

/**
 * Composant Spinner affichant un indicateur de chargement
 */
export const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    color = 'primary',
    label,
    fullScreen = false,
    overlay = false,
    className = ''
}) => {
    // Déterminer les dimensions en fonction de la taille
    const dimensions = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    }[size];

    // Déterminer la couleur du spinner
    const spinnerColor = {
        primary: 'text-blue-600',
        secondary: 'text-gray-600',
        white: 'text-white'
    }[color];

    // Si plein écran, centrer le spinner
    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                <div className="text-center">
                    <div className={`inline-block ${dimensions} ${spinnerColor} ${className}`} role="status">
                        <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="sr-only">Chargement en cours...</span>
                    </div>
                    {label && <div className="mt-2 text-white font-medium">{label}</div>}
                </div>
            </div>
        );
    }

    // Si overlay, afficher sur un fond semi-transparent
    if (overlay) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                <div className="text-center">
                    <div className={`inline-block ${dimensions} ${spinnerColor} ${className}`} role="status">
                        <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="sr-only">Chargement en cours...</span>
                    </div>
                    {label && <div className="mt-2 text-gray-600 font-medium">{label}</div>}
                </div>
            </div>
        );
    }

    // Affichage par défaut
    return (
        <div className={`inline-block ${dimensions} ${spinnerColor} ${className}`} role="status">
            <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="sr-only">Chargement en cours...</span>
            {label && <span className="ml-2">{label}</span>}
        </div>
    );
};

/**
 * Spinner avec message "Chargement des données" pour les composants Calendar
 */
export const CalendarLoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-8">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-gray-600">Chargement des données du calendrier...</p>
    </div>
);

/**
 * Spinner pour les opérations asynchrones dans les formulaires
 */
export const FormSubmitSpinner: React.FC<{ label?: string }> = ({ label = "Enregistrement en cours..." }) => (
    <div className="inline-flex items-center">
        <Spinner size="sm" color="white" className="mr-2" />
        <span>{label}</span>
    </div>
);

export default Spinner; 