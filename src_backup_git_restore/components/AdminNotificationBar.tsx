"use client";

import React, { useEffect, useState } from 'react';

interface LeaveRequest {
    id: number;
    applicant: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: "pending" | "validated" | "refused";
}

const AdminNotificationBar: React.FC = () => {
    const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const fetchPendingRequests = async () => {
        try {
            const res = await fetch('/api/admin/requests');
            if (!res.ok) throw new Error('Erreur lors de la récupération des demandes');
            const data = await res.json();
            const pending = data.filter((req: LeaveRequest) => req.status === 'pending');
            setPendingRequests(pending);
            setCurrentIndex(0);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
        const interval = setInterval(fetchPendingRequests, 60000); // Rafraîchit toutes les 60s
        return () => clearInterval(interval);
    }, []);

    const handleValidate = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'validated' })
            });
            if (!res.ok) throw new Error('Erreur lors de la validation');
            await fetchPendingRequests();
        } catch (error) {
            console.error(error);
        }
    };

    if (pendingRequests.length === 0) {
        return null;
    }

    const currentRequest = pendingRequests[currentIndex];

    return (
        <div className="bg-yellow-100 p-4 flex items-center justify-between">
            <div>
                <p className="font-semibold">Nouvelle demande :</p>
                <p>{currentRequest.applicant} - {currentRequest.leaveType} du {currentRequest.startDate} au {currentRequest.endDate}</p>
            </div>
            <div className="flex items-center">
                <button onClick={() => handleValidate(currentRequest.id)} className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700">
                    Valider rapidement
                </button>
                {pendingRequests.length > 1 && (
                    <button onClick={() => setCurrentIndex((currentIndex + 1) % pendingRequests.length)} className="ml-4 bg-gray-300 text-gray-800 py-1 px-3 rounded hover:bg-gray-400">
                        Suivant
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminNotificationBar; 