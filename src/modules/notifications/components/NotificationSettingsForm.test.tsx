import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationSettingsForm } from './NotificationSettingsForm';

describe('NotificationSettingsForm', () => {
    const mockOnSubmit = jest.fn();
    const defaultProps = {
        onSubmit: mockOnSubmit,
        initialSettings: {
            channels: {
                email: true,
                sms: false,
                push: true
            },
            digestFrequency: 'daily',
            preferences: {
                newMessage: true,
                mentionedInComment: true,
                taskAssigned: true,
                taskCompleted: false,
                projectUpdate: true,
                documentShared: false,
                eventReminder: true
            }
        },
        isLoading: false,
        errorMessage: '',
        successMessage: ''
    };

    beforeEach(() => {
        mockOnSubmit.mockClear();
    });

    test('rend le formulaire avec les paramètres initiaux', () => {
        render(<NotificationSettingsForm {...defaultProps} />);

        // Vérification des titres et sections
        expect(screen.getByText('Canaux de notification')).toBeInTheDocument();
        expect(screen.getByText('Fréquence du résumé')).toBeInTheDocument();
        expect(screen.getByText('Préférences de notification')).toBeInTheDocument();

        // Vérification des toggles de canaux
        const emailLabel = screen.getByText('Email').closest('label');
        const smsLabel = screen.getByText('SMS').closest('label');
        const pushLabel = screen.getByText('Notifications push').closest('label');

        // Vérifions que les éléments existent avant de les utiliser
        if (emailLabel && smsLabel && pushLabel) {
            const emailToggle = emailLabel.querySelector('.toggle-switch');
            const smsToggle = smsLabel.querySelector('.toggle-switch');
            const pushToggle = pushLabel.querySelector('.toggle-switch');

            if (emailToggle && smsToggle && pushToggle) {
                expect(emailToggle).toHaveClass('active');
                expect(smsToggle).not.toHaveClass('active');
                expect(pushToggle).toHaveClass('active');
            }
        }

        // Vérification du select de fréquence
        expect(screen.getByDisplayValue('daily')).toBeInTheDocument();

        // Vérification des checkboxes de préférence
        expect(screen.getByLabelText('Nouveau message')).toBeChecked();
        expect(screen.getByLabelText('Mentionné dans un commentaire')).toBeChecked();
        expect(screen.getByLabelText('Tâche assignée')).toBeChecked();
        expect(screen.getByLabelText('Tâche terminée')).not.toBeChecked();
        expect(screen.getByLabelText('Mise à jour de projet')).toBeChecked();
        expect(screen.getByLabelText('Document partagé')).not.toBeChecked();
        expect(screen.getByLabelText('Rappel d\'événement')).toBeChecked();
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

        const selectElement = screen.getByDisplayValue('daily');
        fireEvent.change(selectElement, { target: { value: 'weekly' } });

        expect(screen.getByDisplayValue('weekly')).toBeInTheDocument();
    });

    test('met à jour les préférences de notification', () => {
        render(<NotificationSettingsForm {...defaultProps} />);

        // Changement d'état d'une checkbox cochée
        fireEvent.click(screen.getByLabelText('Nouveau message'));

        // Changement d'état d'une checkbox non cochée
        fireEvent.click(screen.getByLabelText('Tâche terminée'));

        // Vérification des états mis à jour
        expect(screen.getByLabelText('Nouveau message')).not.toBeChecked();
        expect(screen.getByLabelText('Tâche terminée')).toBeChecked();
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

        fireEvent.click(screen.getByLabelText('Nouveau message'));
        fireEvent.change(screen.getByDisplayValue('daily'), { target: { value: 'weekly' } });

        // Soumission du formulaire
        fireEvent.click(screen.getByText('Enregistrer les préférences'));

        // Vérification que onSubmit a été appelé avec les paramètres modifiés
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                channels: {
                    email: false,
                    sms: false,
                    push: true
                },
                digestFrequency: 'weekly',
                preferences: {
                    newMessage: false,
                    mentionedInComment: true,
                    taskAssigned: true,
                    taskCompleted: false,
                    projectUpdate: true,
                    documentShared: false,
                    eventReminder: true
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

        expect(screen.getByText('Enregistrer les préférences')).toBeDisabled();
    });
}); 