'use client';

import React from 'react';
import { CalendarEvent } from '../types';

interface LeaveModalProps {
    leave: CalendarEvent;
    onClose: () => void;
}

export default function LeaveModal({ leave, onClose }: LeaveModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <h2 className="text-xl font-semibold mb-4">Détails du Congé</h2>
                <p><strong>Type:</strong> {leave.leaveType}</p>
                <p><strong>Statut:</strong> {leave.status}</p>
                <p><strong>Début:</strong> {leave.startDate.toLocaleDateString()}</p>
                <p><strong>Fin:</strong> {leave.endDate.toLocaleDateString()}</p>
                {leave.comment && <p><strong>Commentaire:</strong> {leave.comment}</p>}
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}