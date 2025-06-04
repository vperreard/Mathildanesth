'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayOfWeek, Period } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Input from '@/components/ui/input';
import {
    Search,
    User,
    Clock,
    AlertTriangle,
    CheckCircle,
    Star
} from 'lucide-react';

interface Supervisor {
    id: number;
    name: string;
    specialties: string[];
    availability: {
        day: DayOfWeek;
        period: Period;
        available: boolean;
        conflicts?: string[];
    }[];
    workload: number;
}

interface SupervisorSelectorProps {
    supervisors: Supervisor[];
    selectedSupervisorId: number | null;
    onSupervisorSelect: (supervisorId: number) => void;
    day: DayOfWeek;
    period: Period;
    className?: string;
}

// Composant pour afficher un superviseur
const SupervisorCard: React.FC<{
    supervisor: Supervisor;
    isSelected: boolean;
    availability: {
        day: DayOfWeek;
        period: Period;
        available: boolean;
        conflicts?: string[];
    } | undefined;
    onClick: () => void;
}> = ({ supervisor, isSelected, availability, onClick }) => {
    const hasConflicts = availability?.conflicts && availability.conflicts.length > 0;
    const isAvailable = availability?.available;

    return (
        <motion.div
            className={`
        p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isAvailable
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-red-200 bg-red-50 opacity-60'
                }
      `}
            onClick={onClick}
            whileHover={{ scale: isAvailable ? 1.02 : 1 }}
            whileTap={{ scale: isAvailable ? 0.98 : 1 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{supervisor.name}</span>
                        {isAvailable ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                    </div>

                    {/* Spécialités */}
                    <div className="flex flex-wrap gap-1 mb-2">
                        {supervisor.specialties.slice(0, 2).map(specialty => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                                {specialty}
                            </Badge>
                        ))}
                        {supervisor.specialties.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                                +{supervisor.specialties.length - 2}
                            </Badge>
                        )}
                    </div>

                    {/* Charge de travail */}
                    <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between text-xs">
                                <span>Charge</span>
                                <span className={`font-medium ${supervisor.workload > 90 ? 'text-red-600' :
                                    supervisor.workload > 70 ? 'text-orange-600' :
                                        'text-green-600'
                                    }`}>
                                    {supervisor.workload}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                    className={`h-1.5 rounded-full ${supervisor.workload > 90 ? 'bg-red-500' :
                                        supervisor.workload > 70 ? 'bg-orange-500' :
                                            'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.min(supervisor.workload, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Conflits */}
                    {hasConflicts && (
                        <div className="mt-2">
                            <div className="flex items-center space-x-1 text-xs text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Conflits détectés</span>
                            </div>
                            <div className="mt-1 space-y-1">
                                {availability.conflicts!.slice(0, 2).map((conflict, index) => (
                                    <div key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                        {conflict}
                                    </div>
                                ))}
                                {availability.conflicts!.length > 2 && (
                                    <div className="text-xs text-red-600">
                                        +{availability.conflicts!.length - 2} autres conflits
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Indicateur de sélection */}
                {isSelected && (
                    <motion.div
                        className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                    >
                        <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export const SupervisorSelector: React.FC<SupervisorSelectorProps> = ({
    supervisors,
    selectedSupervisorId,
    onSupervisorSelect,
    day,
    period,
    className = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterByAvailability, setFilterByAvailability] = useState(true);

    // Filtrer et trier les superviseurs
    const filteredSupervisors = useMemo(() => {
        let filtered = supervisors;

        // Filtrer par terme de recherche
        if (searchTerm) {
            filtered = filtered.filter(supervisor =>
                supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supervisor.specialties.some(specialty =>
                    specialty.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Filtrer par disponibilité
        if (filterByAvailability) {
            filtered = filtered.filter(supervisor => {
                const availability = supervisor.availability.find(
                    a => a.day === day && a.period === period
                );
                return availability?.available;
            });
        }

        // Trier par charge de travail (moins chargés en premier)
        return filtered.sort((a, b) => {
            // Priorité aux superviseurs disponibles
            const aAvailability = a.availability.find(av => av.day === day && av.period === period);
            const bAvailability = b.availability.find(av => av.day === day && av.period === period);

            if (aAvailability?.available && !bAvailability?.available) return -1;
            if (!aAvailability?.available && bAvailability?.available) return 1;

            // Ensuite par charge de travail
            return a.workload - b.workload;
        });
    }, [supervisors, searchTerm, filterByAvailability, day, period]);

    const availableCount = supervisors.filter(supervisor => {
        const availability = supervisor.availability.find(
            a => a.day === day && a.period === period
        );
        return availability?.available;
    }).length;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Barre de recherche et filtres */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher un superviseur..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={filterByAvailability ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterByAvailability(!filterByAvailability)}
                            className="text-xs"
                        >
                            Disponibles uniquement
                        </Button>
                        <Badge variant="outline" className="text-xs">
                            {availableCount} disponibles
                        </Badge>
                    </div>

                    <div className="text-xs text-gray-600">
                        {filteredSupervisors.length} résultat{filteredSupervisors.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Liste des superviseurs */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
                <AnimatePresence>
                    {filteredSupervisors.map(supervisor => {
                        const availability = supervisor.availability.find(
                            a => a.day === day && a.period === period
                        );

                        return (
                            <SupervisorCard
                                key={supervisor.id}
                                supervisor={supervisor}
                                isSelected={selectedSupervisorId === supervisor.id}
                                availability={availability}
                                onClick={() => availability?.available && onSupervisorSelect(supervisor.id)}
                            />
                        );
                    })}
                </AnimatePresence>

                {filteredSupervisors.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun superviseur trouvé</p>
                        <p className="text-sm">
                            {searchTerm
                                ? 'Essayez de modifier votre recherche'
                                : 'Aucun superviseur disponible pour cette période'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Résumé de sélection */}
            {selectedSupervisorId && (
                <motion.div
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                            Superviseur sélectionné
                        </span>
                    </div>
                    {(() => {
                        const selected = supervisors.find(s => s.id === selectedSupervisorId);
                        return selected ? (
                            <div className="mt-1 text-sm text-blue-700">
                                {selected.name} - Charge: {selected.workload}%
                            </div>
                        ) : null;
                    })()}
                </motion.div>
            )}
        </div>
    );
};

export default SupervisorSelector; 