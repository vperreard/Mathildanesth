"use client";

import React, { useState, useEffect } from 'react';

interface LeaveRequest {
    id: number;
    applicant: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'validated' | 'refused';
}

const RequestsPage: React.FC = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/requests');
            if (!res.ok) throw new Error('Erreur lors de la récupération des requêtes');
            const data = await res.json();
            setRequests(data);
        } catch (err: any) {
            setError(err.message || 'Erreur inconnue');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleValidate = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'validated' })
            });
            if (!res.ok) throw new Error("Erreur lors de la validation de la requête");
            await fetchRequests();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Panneau des Requêtes de Congés</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {isLoading ? (
                <p>Chargement...</p>
            ) : (
                <table className="min-w-full border-collapse border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border">Demandeur</th>
                            <th className="px-4 py-2 border">Type de congé</th>
                            <th className="px-4 py-2 border">Dates</th>
                            <th className="px-4 py-2 border">Statut</th>
                            <th className="px-4 py-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-2 border text-center">Aucune requête</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-4 py-2 border">{req.applicant}</td>
                                    <td className="px-4 py-2 border">{req.leaveType}</td>
                                    <td className="px-4 py-2 border">{req.startDate} au {req.endDate}</td>
                                    <td className="px-4 py-2 border">{req.status}</td>
                                    <td className="px-4 py-2 border">
                                        {req.status === 'pending' && (
                                            <button onClick={() => handleValidate(req.id)} className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700">
                                                Valider
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default RequestsPage; 