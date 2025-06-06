'use client';

import Link from 'next/link';
// TODO: Replace @heroicons with lucide-react
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { IncompatibilityType } from '@prisma/client'; // Assurez-vous que Prisma Client est généré et accessible
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Définition du type pour une incompatibilité, à ajuster selon les données réelles
// que vous allez récupérer de l'API.
// personnel1Display et personnel2Display seront construits côté serveur ou service.
export interface DisplayPersonnelIncompatibility {
    id: string;
    personnel1Display: string; // e.g., "Nom Prénom (Rôle)" ou "Nom Prénom (Chirurgien)"
    personnel2Display: string;
    type: IncompatibilityType;
    startDate: Date | null;
    endDate: Date | null;
    reason: string | null;
    createdByUserDisplay?: string; // Nom de l'utilisateur qui a créé
    createdAt: Date;
    updatedAt: Date;
}

interface IncompatibilitesTableProps {
    incompatibilities: DisplayPersonnelIncompatibility[];
    // onDelete?: (id: string) => Promise<void>; // Optionnel: pour la suppression directe depuis la table
}

const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(date, 'dd/MM/yyyy', { locale: fr });
};

export function IncompatibilitesTable({ incompatibilities }: IncompatibilitesTableProps) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Personnel 1</TableHead>
                        <TableHead>Personnel 2</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Motif</TableHead>
                        <TableHead>Début</TableHead>
                        <TableHead>Fin</TableHead>
                        <TableHead>Créé par</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {incompatibilities.map((incompat) => (
                        <TableRow key={incompat.id}>
                            <TableCell>{incompat.personnel1Display}</TableCell>
                            <TableCell>{incompat.personnel2Display}</TableCell>
                            <TableCell>
                                <Badge variant={incompat.type === 'BLOQUANT' ? 'destructive' : 'secondary'}>
                                    {incompat.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={incompat.reason || ''}>
                                {incompat.reason || '-'}
                            </TableCell>
                            <TableCell>{formatDate(incompat.startDate)}</TableCell>
                            <TableCell>{formatDate(incompat.endDate)}</TableCell>
                            <TableCell>{incompat.createdByUserDisplay || 'N/A'}</TableCell>
                            <TableCell>{formatDate(incompat.createdAt)}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                    <Link href={`/admin/incompatibilites/${incompat.id}/edit`} passHref>
                                        <Button variant="outline" size="icon" title="Modifier">
                                            {/* <PencilIcon className="h-4 w-4" /> */}
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        title="Supprimer"
                                        onClick={() => onDelete?.(incompat.id)}
                                    >
                                        {/* <TrashIcon className="h-4 w-4" /> */}
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};