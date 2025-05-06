import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Assignment, AssignmentStatus } from '@/types/assignment';
import { ShiftType } from '@/types/common';
import { User } from '@/types/user';
import { RulesConfiguration } from '@/types/rules';
import { PlanningGeneratorService } from '../services/PlanningGeneratorService';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

interface PlanningViewProps {
    users: User[];
    rules: RulesConfiguration;
    startDate: Date;
    endDate: Date;
    onSave?: (assignments: Assignment[]) => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({
    users,
    rules,
    startDate,
    endDate,
    onSave
}) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Générer le planning
    const generatePlanning = useCallback(async () => {
        setLoading(true);
        try {
            const generator = new PlanningGeneratorService(users, rules, startDate, endDate);
            const newAssignments = generator.generatePlanning();
            const validation = generator.validatePlanning();

            if (!validation.isValid) {
                setValidationErrors(validation.errors);
                toast.error('Le planning généré contient des erreurs');
            } else {
                setValidationErrors([]);
                toast.success('Planning généré avec succès');
            }

            setAssignments(Array.isArray(newAssignments) ? newAssignments : []);
        } catch (error) {
            toast.error('Erreur lors de la génération du planning');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [users, rules, startDate, endDate]);

    // Sauvegarder le planning
    const handleSave = useCallback(() => {
        if (onSave) {
            onSave(assignments);
            toast.success('Planning sauvegardé avec succès');
        }
    }, [assignments, onSave]);

    // Filtrer les affectations par date
    const getAssignmentsForDate = useCallback((date: Date) => {
        // S'assurer que assignments est bien un tableau
        if (!Array.isArray(assignments)) return [];

        return assignments.filter(assignment =>
            format(new Date(assignment.startDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
    }, [assignments]);

    // Filtrer les affectations par utilisateur
    const getAssignmentsForUser = useCallback((user: User) => {
        // S'assurer que assignments est bien un tableau
        if (!Array.isArray(assignments)) return [];

        return assignments.filter(assignment => assignment.userId === user.id);
    }, [assignments]);

    // Rendre le planning
    const renderPlanning = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => (
                    <motion.div
                        key={user.id}
                        className="bg-white rounded-lg shadow p-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                {user.prenom} {user.nom}
                            </h3>
                            <span className="text-sm text-gray-500">
                                {user.role}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {getAssignmentsForUser(user).map(assignment => (
                                <motion.div
                                    key={assignment.id}
                                    className={`p-2 rounded ${assignment.status === AssignmentStatus.APPROVED
                                        ? 'bg-green-100'
                                        : assignment.status === AssignmentStatus.REJECTED
                                            ? 'bg-red-100'
                                            : 'bg-gray-100'
                                        }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                            {format(new Date(assignment.startDate), 'HH:mm')} - {format(new Date(assignment.endDate), 'HH:mm')}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {assignment.shiftType}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {format(new Date(assignment.startDate), 'EEEE d MMMM', { locale: fr })}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };

    // Rendre les erreurs de validation
    const renderValidationErrors = () => {
        if (validationErrors.length === 0) return null;

        return (
            <motion.div
                className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h4 className="text-red-800 font-semibold mb-2">Erreurs de validation :</h4>
                <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                        <li key={index} className="text-red-600 text-sm">
                            {error}
                        </li>
                    ))}
                </ul>
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Planning</h2>
                <div className="space-x-2">
                    <button
                        onClick={generatePlanning}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        disabled={loading}
                    >
                        {loading ? 'Génération...' : 'Générer le planning'}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        disabled={loading || assignments.length === 0}
                    >
                        Sauvegarder
                    </button>
                </div>
            </div>

            {renderPlanning()}
            {renderValidationErrors()}
        </div>
    );
}; 