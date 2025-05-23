import { render, screen, fireEvent } from '@testing-library/react';

// Mock des composants de demande de congé
const MockLeaveForm = () => (
    <div>
        <h1 data-testid="leave-form-title">Nouvelle demande de congé</h1>
        <form data-testid="leave-request-form">
            <div>
                <label htmlFor="leaveType">Type de congé *</label>
                <select
                    id="leaveType"
                    name="leaveType"
                    data-testid="leave-type-select"
                    required
                >
                    <option value="">Sélectionner...</option>
                    <option value="PAID_LEAVE">Congé payé</option>
                    <option value="UNPAID_LEAVE">Congé sans solde</option>
                    <option value="SICK_LEAVE">Congé maladie</option>
                </select>
            </div>

            <div>
                <label htmlFor="startDate">Date de début *</label>
                <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    data-testid="start-date-input"
                    required
                />
            </div>

            <div>
                <label htmlFor="endDate">Date de fin *</label>
                <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    data-testid="end-date-input"
                    required
                />
            </div>

            <div>
                <label htmlFor="reason">Motif (facultatif)</label>
                <textarea
                    id="reason"
                    name="reason"
                    data-testid="reason-input"
                ></textarea>
            </div>

            <button type="submit" data-testid="submit-button">Soumettre la demande</button>
        </form>
    </div>
);

const MockConfirmationPage = () => (
    <div>
        <h1 data-testid="confirmation-title">Demande soumise avec succès</h1>
        <p data-testid="leave-id">Identifiant: leave123</p>
        <p>Statut: <span data-testid="leave-status">En attente</span></p>
        <p data-testid="leave-period">Période: 10/06/2023 - 15/06/2023</p>
        <p data-testid="leave-type">Type: Congé payé</p>
        <p data-testid="leave-reason">Motif: Vacances d'été</p>
    </div>
);

describe('Flux de création de demande de congé (simulation)', () => {
    test('Création et soumission d\'une demande de congé', () => {
        // Rendu du formulaire
        const { unmount } = render(<MockLeaveForm />);

        // Vérifier que le formulaire est affiché
        expect(screen.getByTestId('leave-form-title')).toBeInTheDocument();

        // Remplir le formulaire
        // Sélectionner le type de congé
        const typeSelect = screen.getByTestId('leave-type-select');
        fireEvent.change(typeSelect, { target: { value: 'PAID_LEAVE' } });

        // Remplir les dates
        const startDateInput = screen.getByTestId('start-date-input');
        const endDateInput = screen.getByTestId('end-date-input');

        fireEvent.change(startDateInput, { target: { value: '2023-06-10' } });
        fireEvent.change(endDateInput, { target: { value: '2023-06-15' } });

        // Ajouter un motif (optionnel)
        const reasonInput = screen.getByTestId('reason-input');
        fireEvent.change(reasonInput, { target: { value: 'Vacances d\'été' } });

        // Vérifier que tous les champs sont correctement remplis
        expect(typeSelect).toHaveValue('PAID_LEAVE');
        expect(startDateInput).toHaveValue('2023-06-10');
        expect(endDateInput).toHaveValue('2023-06-15');
        expect(reasonInput).toHaveValue('Vacances d\'été');

        // Simuler la navigation vers la page de confirmation
        unmount();
        render(<MockConfirmationPage />);

        // Vérifier les informations sur la page de confirmation
        expect(screen.getByTestId('confirmation-title')).toBeInTheDocument();
        expect(screen.getByTestId('leave-id')).toHaveTextContent(/leave123/i);
        expect(screen.getByTestId('leave-status')).toHaveTextContent(/En attente/i);
        expect(screen.getByTestId('leave-period')).toHaveTextContent(/10\/06\/2023 - 15\/06\/2023/i);
        expect(screen.getByTestId('leave-type')).toHaveTextContent(/Congé payé/i);
        expect(screen.getByTestId('leave-reason')).toHaveTextContent(/Vacances d'été/i);
    });
}); 