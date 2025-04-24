'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Supprimer les imports liés à l'ancien système
// import { LeaveType } from '../types/leave'; 
// import { getLeaveTypeLabel } from '../services/leaveService';
import { format } from 'date-fns';

// Interface pour les données des types de congés venant de l'API
interface SelectableLeaveType {
    id: string;
    code: string;
    label: string;
    description?: string;
}

interface LeaveFormProps {
    userId: number;
    onSuccess: (newLeave: any) => void;
}

export const LeaveForm: React.FC<LeaveFormProps> = ({ userId, onSuccess }) => {
    // State pour les types de congés chargés depuis l'API
    const [availableLeaveTypes, setAvailableLeaveTypes] = useState<SelectableLeaveType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState<boolean>(true);
    const [loadTypeError, setLoadTypeError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    // leaveType stocke maintenant le 'code' (string) du type sélectionné
    const [leaveType, setLeaveType] = useState<string>(''); // Initialiser vide ou avec un code par défaut si possible
    const [reason, setReason] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Charger les types de congés au montage
    useEffect(() => {
        const fetchTypes = async () => {
            setIsLoadingTypes(true);
            setLoadTypeError(null);
            try {
                const response = await fetch('/api/leaves/types');
                if (!response.ok) {
                    throw new Error(`Erreur HTTP ${response.status}`);
                }
                const data: SelectableLeaveType[] = await response.json();
                setAvailableLeaveTypes(data);
                // Pré-sélectionner le premier type de la liste s'il y en a
                if (data.length > 0) {
                    setLeaveType(data[0].code);
                }
            } catch (err: any) {
                console.error("Erreur lors du chargement des types de congés:", err);
                setLoadTypeError("Impossible de charger les types de congés.");
            } finally {
                setIsLoadingTypes(false);
            }
        };
        fetchTypes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (!startDate || !endDate) {
            setError('Veuillez sélectionner une date de début et de fin.');
            setIsSubmitting(false);
            return;
        }
        if (!leaveType) {
            setError('Veuillez sélectionner un type de congé.');
            setIsSubmitting(false);
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            setError('La date de fin ne peut pas être antérieure à la date de début.');
            setIsSubmitting(false);
            return;
        }

        try {
            // !! IMPORTANT !!
            // L'API /api/leaves attend probablement encore le champ `type` (l'enum).
            // Nous envoyons `typeCode` ici.
            // Il faudra mettre à jour l'API /api/leaves (POST) pour qu'elle accepte `typeCode`.
            const response = await axios.post('/api/leaves', {
                userId,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                typeCode: leaveType, // Envoyer le code sélectionné
                // type: leaveType // L'ancienne version si l'API n'est pas encore migrée
                reason,
            });
            onSuccess(response.data);
        } catch (err: any) {
            console.error("Erreur lors de la soumission de la demande:", err);
            setError(err.response?.data?.error || 'Une erreur est survenue.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Type de congé</label>
                <select
                    id="leaveType"
                    name="leaveType"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)} // Mettre à jour le code (string)
                    required
                    disabled={isLoadingTypes || availableLeaveTypes.length === 0}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100"
                >
                    {isLoadingTypes ? (
                        <option value="">Chargement...</option>
                    ) : loadTypeError ? (
                        <option value="">Erreur</option>
                    ) : availableLeaveTypes.length === 0 ? (
                        <option value="">Aucun type disponible</option>
                    ) : (
                        <>
                            <option value="">-- Sélectionner un type --</option>
                            {/* Itérer sur les types chargés depuis l'API */}
                            {availableLeaveTypes.map((type) => (
                                <option key={type.code} value={type.code} title={type.description}>
                                    {type.label}
                                </option>
                            ))}
                        </>
                    )}
                </select>
                {loadTypeError && <p className="text-xs text-red-500 mt-1">{loadTypeError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Date de début</label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Date de fin</label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motif (optionnel)</label>
                <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded">
                    <p>{error}</p>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting || isLoadingTypes}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSubmitting ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
                >
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
            </div>
        </form>
    );
}; 