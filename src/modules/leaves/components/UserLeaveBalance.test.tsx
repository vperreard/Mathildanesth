import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import UserLeaveBalance from './UserLeaveBalance';
import {
    expectToBeInDocument,
    expectToHaveTextContent,
    expectToHaveBeenCalledWith,
    anyValue,
    expectNotToBeInDocument
} from '@/tests/utils/assertions';

// Mock de l'API /api/leaves/balance
// global.fetch = jest.fn();

// Mock d'axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock du composant lui-même pour l'instant, car il n'existe pas
// const MockUserLeaveBalance: React.FC<{ userId: number }> = ({ userId }) => (
//     <div>User ID: {userId} - Balances Placeholder</div>
// );

describe('UserLeaveBalance Component', () => {
    beforeEach(() => {
        // (global.fetch as jest.Mock).mockClear();
        jest.clearAllMocks();
    });

    const mockBalanceData = [
        {
            typeCode: 'ANNUAL',
            typeName: 'Congé Annuel',
            balance: 15.5,
            allowance: 25,
            carryOver: 2.5,
            taken: 12,
            pending: 1,
            transferred: 0,
        },
        {
            typeCode: 'RTT',
            typeName: 'RTT',
            balance: 5,
            allowance: 10,
            carryOver: 0,
            taken: 5,
            pending: 0,
            transferred: 0,
        },
    ];

    // Supprimer les tests placeholders qui utilisent expect(true).toBe(true)
    // it('should display loading state initially', async () => {
    //     expect(true).toBe(true); // Placeholder
    //     console.log('Placeholder test for UserLeaveBalance loading state');
    // });

    // it('should display balances correctly after successful fetch', async () => {
    //     expect(true).toBe(true); // Placeholder
    //     console.log('Placeholder test for UserLeaveBalance success state');
    // });

    // it('should display error message if fetch fails', async () => {
    //     expect(true).toBe(true); // Placeholder
    //     console.log('Placeholder test for UserLeaveBalance error state');
    // });

    it('affiche correctement les soldes de congés', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockBalanceData });
        render(<UserLeaveBalance userId={123} />);

        expectToBeInDocument(screen.getByText('Chargement des soldes...'));
        await waitFor(() => {
            expectToBeInDocument(screen.getByText('Congé Annuel'));
        });

        expectToBeInDocument(screen.getByText('Congé Annuel'));
        expectToBeInDocument(screen.getByText('15.5 jours'));
        expectToBeInDocument(screen.getByText('RTT'));
        expectToBeInDocument(screen.getByText('5 jours'));
        expectToBeInDocument(screen.getByText('Allocation annuelle:'));
        expectToBeInDocument(screen.getByText('25 j'));
        expectToBeInDocument(screen.getByText('Report année précédente:'));
        expectToBeInDocument(screen.getByText('2.5 j'));
        expectToBeInDocument(screen.getByText('En attente de validation:'));
        expectToBeInDocument(screen.getByText('1 j'));

        expectToHaveBeenCalledWith(mockedAxios.get, '/api/leaves/balance', {
            params: { userId: 123, year: anyValue(Number) }
        });
    });

    it('affiche un message d\'erreur si le chargement échoue', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
        render(<UserLeaveBalance userId={123} />);
        await waitFor(() => {
            expectToBeInDocument(screen.getByText('Erreur'));
        });
        expectToBeInDocument(screen.getByText('Impossible de charger les soldes de congés'));
    });

    it('affiche un message si aucun solde n\'est disponible', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: [] });
        render(<UserLeaveBalance userId={123} />);
        await waitFor(() => {
            expectToBeInDocument(screen.getByText('Aucun solde disponible'));
        });
    });

    it('respecte l\'option compact=true en masquant les détails', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockBalanceData });
        render(<UserLeaveBalance userId={123} compact={true} />);
        await waitFor(() => {
            expectToBeInDocument(screen.getByText('Congé Annuel'));
        });
        expectToBeInDocument(screen.getByText('15.5 jours'));
        expectToBeInDocument(screen.getByText('5 jours'));
        expectNotToBeInDocument(screen.queryByText('Allocation annuelle:'));
        expectNotToBeInDocument(screen.queryByText('Report année précédente:'));
    });

    it('respecte l\'option hideHeader=true', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: mockBalanceData });
        render(<UserLeaveBalance userId={123} hideHeader={true} />);
        await waitFor(() => {
            expectToBeInDocument(screen.getByText('Congé Annuel'));
        });
        expectNotToBeInDocument(screen.queryByText('Soldes de congés'));
    });
}); 