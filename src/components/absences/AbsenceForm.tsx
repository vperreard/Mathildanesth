import React, { useState } from 'react';
import { AbsenceCreateInput, AbsenceType } from '@/types/absence';
import { toast } from 'react-hot-toast';

interface AbsenceFormProps {
    onSubmit: (data: AbsenceCreateInput) => Promise<void>;
    onCancel: () => void;
}

export const AbsenceForm: React.FC<AbsenceFormProps> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<AbsenceCreateInput>({
        userId: 0, // TODO: Récupérer l'ID de l'utilisateur connecté
        startDate: new Date(),
        endDate: new Date(),
        type: 'VACATION',
        reason: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            toast.success('Absence créée avec succès');
        } catch (error) {
            toast.error('Erreur lors de la création de l\'absence');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Type d'absence</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AbsenceType })}
                    className="w-full p-2 border rounded-md"
                >
                    <option value="VACATION">Vacances</option>
                    <option value="SICK">Maladie</option>
                    <option value="PERSONAL">Personnel</option>
                    <option value="OTHER">Autre</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Date de début</label>
                <input
                    type="date"
                    value={formData.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Date de fin</label>
                <input
                    type="date"
                    value={formData.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Motif</label>
                <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    rows={4}
                />
            </div>

            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Créer
                </button>
            </div>
        </form>
    );
}; 