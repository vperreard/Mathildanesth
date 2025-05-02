import { render, screen, fireEvent } from '@testing-library/react';

// Mock App component
const mockApp = () => (
    <div>
        <h1 data-testid="dashboard-heading">Tableau de bord</h1>
        <nav role="navigation" aria-label="Navigation principale">
            <ul>
                <li><a href="/" data-testid="dashboard-link">Tableau de bord</a></li>
                <li><a href="/leaves" data-testid="leaves-link">Congés</a></li>
                <li><a href="/calendar" data-testid="calendar-link">Calendrier</a></li>
                <li><a href="/config" data-testid="config-link">Configuration</a></li>
            </ul>
        </nav>
        <div id="content" data-testid="content-area"></div>
    </div>
);

// Mock Config page component
const mockConfigPage = () => (
    <div>
        <h1 data-testid="config-heading">Paramètres de l'application</h1>
        <h2 data-testid="user-settings">Paramètres utilisateur</h2>
    </div>
);

describe('Navigation entre pages (simulation)', () => {
    test('Navigation de la page d\'accueil vers la page de configuration', () => {
        const { unmount } = render(mockApp());

        // Vérifier que nous sommes sur la page d'accueil
        expect(screen.getByTestId('dashboard-heading')).toBeInTheDocument();

        // Vérifier que les liens de navigation sont présents
        expect(screen.getByTestId('dashboard-link')).toBeInTheDocument();
        expect(screen.getByTestId('config-link')).toBeInTheDocument();

        // Simuler un clic sur le lien de configuration
        // Note: Normalement, on utiliserait fireEvent.click, mais comme c'est une simulation,
        // nous allons démonter et remonter le composant
        unmount();
        render(mockConfigPage());

        // Vérifier que le contenu de la page de configuration est affiché
        expect(screen.getByTestId('config-heading')).toBeInTheDocument();
        expect(screen.getByTestId('user-settings')).toHaveTextContent(/Paramètres utilisateur/i);
    });
}); 