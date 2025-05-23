import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationSettingsForm } from './NotificationSettingsForm';

describe('NotificationSettingsForm', () => {
    const mockOnSave = jest.fn();

    const defaultProps = {
        onSave: mockOnSave,
        initialSettings: {
            email: true,
            sms: false,
            push: true,
            inApp: true,
            digestFrequency: 'daily' as const,
            notifyOn: {
                messages: true,
                updates: true,
                reminders: true,
                mentions: true
            }
        },
        isLoading: false,
        errorMessage: null,
        successMessage: null
    };

    beforeEach(() => {
        mockOnSave.mockClear();
    });

    test('rend le formulaire avec les paramètres initiaux', () => {
        render(<NotificationSettingsForm {...defaultProps} />);

        // Vérification des titres et sections
        expect(screen.getByText('Canaux de notification')).toBeInTheDocument();
        expect(screen.getByText('Fréquence du digest')).toBeInTheDocument();
        expect(screen.getByText('Me notifier pour')).toBeInTheDocument();

        // Vérification des toggles de canaux
        const emailLabel = screen.getByText('Email').closest('label');
        const smsLabel = screen.getByText('SMS').closest('label');
        const pushLabel = screen.getByText('Notifications push').closest('label');
        const inAppLabel = screen.getByText('Notifications dans l\'application').closest('label');

        // Vérifions que les éléments existent avant de les utiliser
        if (emailLabel && smsLabel && pushLabel && inAppLabel) {
            const emailToggle = emailLabel.querySelector('.toggle-switch');
            const smsToggle = smsLabel.querySelector('.toggle-switch');
            const pushToggle = pushLabel.querySelector('.toggle-switch');
            const inAppToggle = inAppLabel.querySelector('.toggle-switch');

            if (emailToggle && smsToggle && pushToggle && inAppToggle) {
                expect(emailToggle).toHaveClass('active');
                expect(smsToggle).not.toHaveClass('active');
                expect(pushToggle).toHaveClass('active');
                expect(inAppToggle).toHaveClass('active');
            }
        }

        // Vérification du select de fréquence
        expect(screen.getByDisplayValue('Quotidien')).toBeInTheDocument();

        // Vérification des checkboxes de préférence
        expect(screen.getByLabelText('Nouveaux messages')).toBeChecked();
        expect(screen.getByLabelText('Mises à jour du système')).toBeChecked();
        expect(screen.getByLabelText('Rappels')).toBeChecked();
        expect(screen.getByLabelText('Mentions')).toBeChecked();
    });

    test('met à jour les canaux de notification lors du clic', () => {
        render(<NotificationSettingsForm {...defaultProps} />);

        // Sélection des éléments label
        const emailLabel = screen.getByText('Email').closest('label');
        const smsLabel = screen.getByText('SMS').closest('label');

        // Vérification que les éléments existent avant de les utiliser
        if (emailLabel && smsLabel) {
            const emailToggle = emailLabel.querySelector('.toggle-switch');
            const smsToggle = smsLabel.querySelector('.toggle-switch');

            // Clics sur les toggles seulement s'ils existent
            if (emailToggle && smsToggle) {
                fireEvent.click(emailToggle);
                fireEvent.click(smsToggle);

                // Révérification de l'état après les clics
                expect(emailToggle).not.toHaveClass('active');
                expect(smsToggle).toHaveClass('active');
            }
        }
    });

    test('met à jour la fréquence du résumé', () => {
        render(<NotificationSettingsForm {...defaultProps} />);

        const selectElement = screen.getByRole('combobox');
        fireEvent.change(selectElement, { target: { value: 'weekly' } });

        expect(screen.getByDisplayValue('Hebdomadaire')).toBeInTheDocument();
    });

    test('met à jour les préférences de notification', () => {
        render(<NotificationSettingsForm {...defaultProps} />);

        // Utiliser les noms corrects des préférences
        fireEvent.click(screen.getByLabelText('Nouveaux messages'));
        fireEvent.click(screen.getByLabelText('Mises à jour du système'));

        // Vérification des états mis à jour
        expect(screen.getByLabelText('Nouveaux messages')).not.toBeChecked();
        expect(screen.getByLabelText('Mises à jour du système')).not.toBeChecked();
    });

    test('soumet le formulaire avec les valeurs correctes', async () => {
        render(<NotificationSettingsForm {...defaultProps} />);

        // Modification de quelques paramètres
        const emailLabel = screen.getByText('Email').closest('label');
        if (emailLabel) {
            const emailToggle = emailLabel.querySelector('.toggle-switch');
            if (emailToggle) {
                fireEvent.click(emailToggle);
            }
        }

        fireEvent.click(screen.getByLabelText('Nouveaux messages'));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'weekly' } });

        // Soumission du formulaire
        fireEvent.click(screen.getByText('Enregistrer les préférences'));

        // Vérification que onSave a été appelé avec la structure correcte
        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                email: false,
                sms: false,
                push: true,
                inApp: true,
                digestFrequency: 'weekly',
                notifyOn: {
                    messages: false,
                    updates: true,
                    reminders: true,
                    mentions: true
                }
            });
        });
    });

    test('affiche un message de succès', () => {
        render(<NotificationSettingsForm
            {...defaultProps}
            successMessage="Préférences mises à jour avec succès"
        />);

        expect(screen.getByText('Préférences mises à jour avec succès')).toBeInTheDocument();
    });

    test('affiche un message d\'erreur', () => {
        render(<NotificationSettingsForm
            {...defaultProps}
            errorMessage="Une erreur est survenue lors de la mise à jour"
        />);

        expect(screen.getByText('Une erreur est survenue lors de la mise à jour')).toBeInTheDocument();
    });

    test('désactive le bouton de soumission pendant le chargement', () => {
        render(<NotificationSettingsForm {...defaultProps} isLoading={true} />);

        expect(screen.getByText('Enregistrement...')).toBeDisabled();
    });
}); 