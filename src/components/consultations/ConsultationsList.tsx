import React, { useState } from 'react';
import { Period } from '@prisma/client';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui';
import { formatDate } from '@/utils/dateUtils';
import { Eye, Edit, Trash2, Plus, Filter } from 'lucide-react';

export type Consultation = {
    id: string;
    date: Date;
    userId: number;
    user?: {
        id: number;
        nom: string;
        prenom: string;
    };
    period: Period;
    heureDebut?: string;
    heureFin?: string;
    notes?: string;
    specialtyId?: number;
    specialty?: {
        id: number;
        name: string;
    };
    siteId?: string;
    site?: {
        id: string;
        name: string;
    };
};

type ConsultationsListProps = {
    consultations: Consultation[];
    onEdit: (consultation: Consultation) => void;
    onDelete: (id: string) => void;
    onView: (consultation: Consultation) => void;
    onNew: () => void;
    isLoading?: boolean;
    periods?: Period[];
    onPeriodFilter?: (period: Period | null) => void;
    onDateFilter?: (date: Date | null) => void;
    selectedDate?: Date | null;
    selectedPeriod?: Period | null;
};

const ConsultationsList: React.FC<ConsultationsListProps> = ({
    consultations,
    onEdit,
    onDelete,
    onView,
    onNew,
    isLoading = false,
    periods = [],
    onPeriodFilter,
    onDateFilter,
    selectedDate,
    selectedPeriod,
}) => {
    const [showFilters, setShowFilters] = useState(false);

    // Convertir l'énumération Period en texte lisible
    const getPeriodText = (period: Period): string => {
        switch (period) {
            case 'MATIN':
                return 'Matin';
            case 'APRES_MIDI':
                return 'Après-midi';
            case 'JOURNEE_ENTIERE':
                return 'Journée entière';
            default:
                return period;
        }
    };

    const handleClearFilters = () => {
        if (onPeriodFilter) onPeriodFilter(null);
        if (onDateFilter) onDateFilter(null);
    };

    const handlePeriodChange = (value: string) => {
        if (onPeriodFilter) {
            if (value === 'ALL') {
                onPeriodFilter(null);
            } else {
                onPeriodFilter(value as Period);
            }
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Consultations</CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filtres
                    </Button>
                    <Button onClick={onNew} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle
                    </Button>
                </div>
            </CardHeader>

            {showFilters && (
                <div className="px-6 py-2 border-b border-gray-200 bg-gray-50 flex flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Période:</span>
                        <Select
                            value={selectedPeriod || 'ALL'}
                            onValueChange={handlePeriodChange}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Toutes</SelectItem>
                                <SelectItem value="MATIN">Matin</SelectItem>
                                <SelectItem value="APRES_MIDI">Après-midi</SelectItem>
                                <SelectItem value="JOURNEE_ENTIERE">Journée entière</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ajoutez d'autres filtres ici au besoin */}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="ml-auto"
                    >
                        Effacer les filtres
                    </Button>
                </div>
            )}

            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-4 text-center">Chargement...</div>
                ) : consultations.length === 0 ? (
                    <div className="p-4 text-center">
                        Aucune consultation trouvée.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Médecin</TableHead>
                                <TableHead>Période</TableHead>
                                <TableHead>Horaires</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consultations.map((consultation) => (
                                <TableRow key={consultation.id}>
                                    <TableCell>{formatDate(consultation.date)}</TableCell>
                                    <TableCell>
                                        {consultation.user
                                            ? `${consultation.user.prenom} ${consultation.user.nom}`
                                            : 'Non assigné'}
                                    </TableCell>
                                    <TableCell>{getPeriodText(consultation.period)}</TableCell>
                                    <TableCell>
                                        {consultation.heureDebut && consultation.heureFin
                                            ? `${consultation.heureDebut} - ${consultation.heureFin}`
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {consultation.site ? consultation.site.name : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onView(consultation)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(consultation)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(consultation.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default ConsultationsList; 