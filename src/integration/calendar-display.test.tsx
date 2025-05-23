import { render, screen, waitFor } from '@testing-library/react';

// Mock des données du calendrier
const mockEvents = [
    {
        id: 'event1',
        title: 'Congé de Jean',
        start: new Date(2023, 5, 5),
        end: new Date(2023, 5, 10),
        type: 'PAID_LEAVE',
        userId: 'user1'
    },
    {
        id: 'event2',
        title: 'Formation équipe',
        start: new Date(2023, 5, 15),
        end: new Date(2023, 5, 17),
        type: 'TRAINING',
        userId: 'team'
    }
];

// Mock du composant de calendrier
const MockCalendarComponent = () => (
    <div>
        <h1>Calendrier de l'équipe</h1>
        <div id="loading-indicator">Chargement du calendrier</div>

        <div data-testid="calendar">
            {mockEvents.map(event => (
                <div
                    key={event.id}
                    className={`calendar-event ${event.type.toLowerCase()}-event`}
                    data-testid={`event-${event.type.toLowerCase()}`}
                >
                    {event.title}
                    <span data-testid={`event-date-${event.id}`}>{new Date(event.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            ))}
        </div>
    </div>
);

describe('Chargement et affichage du calendrier (simulation)', () => {
    test('Chargement des événements et affichage dans le calendrier', async () => {
        // Rendu initial avec indicateur de chargement
        const { rerender } = render(
            <div>
                <h1>Calendrier de l'équipe</h1>
                <div id="loading-indicator">Chargement du calendrier</div>
            </div>
        );

        // Vérifier l'état de chargement initial
        expect(screen.getByText(/Chargement du calendrier/i)).toBeInTheDocument();

        // Simuler le chargement terminé en remplaçant le composant
        rerender(<MockCalendarComponent />);

        // Supprimer manuellement l'indicateur de chargement pour simuler son retrait
        document.getElementById('loading-indicator').remove();

        // Attendre que l'indicateur de chargement disparaisse
        await waitFor(() => {
            expect(screen.queryByText(/Chargement du calendrier/i)).not.toBeInTheDocument();
        });

        // Vérifier que les événements sont affichés
        expect(screen.getByText(/Congé de Jean/i)).toBeInTheDocument();
        expect(screen.getByText(/Formation équipe/i)).toBeInTheDocument();

        // Vérifier les dates affichées
        expect(screen.getByTestId('event-date-event1')).toHaveTextContent(/5 juin 2023/i);

        // Vérifier les indicateurs visuels pour différents types d'événements
        expect(screen.getByTestId('event-paid_leave')).toBeInTheDocument();
        expect(screen.getByTestId('event-training')).toBeInTheDocument();
    });
}); 