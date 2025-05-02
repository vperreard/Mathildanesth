import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { OperatingSupervisionRule } from '../types';
import { supervisionRulesService } from '../services/SupervisionRulesService';
import { operatingRoomService } from '../services/OperatingRoomService';

interface SupervisionRulesListProps {
    onAddRule: () => void;
    onEditRule: (rule: OperatingSupervisionRule) => void;
}

export const SupervisionRulesList: React.FC<SupervisionRulesListProps> = ({
    onAddRule,
    onEditRule
}) => {
    const [rules, setRules] = useState<OperatingSupervisionRule[]>([]);
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ruleToDelete, setRuleToDelete] = useState<OperatingSupervisionRule | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [showConflicts, setShowConflicts] = useState(false);

    // Charger les données au montage du composant
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Récupérer toutes les règles
            const allRules = supervisionRulesService.getAll();
            setRules(allRules);

            // Vérifier les conflits entre règles
            const ruleConflicts = supervisionRulesService.detectRuleConflicts();
            setConflicts(ruleConflicts);

            setError(null);
        } catch (err) {
            setError("Erreur lors du chargement des règles de supervision");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (rule: OperatingSupervisionRule) => {
        setRuleToDelete(rule);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!ruleToDelete) return;

        try {
            // Supprimer la règle
            const success = supervisionRulesService.delete(ruleToDelete.id);
            if (success) {
                // Recharger les données après suppression
                loadData();
            } else {
                setError("Échec de la suppression de la règle");
            }
        } catch (err) {
            setError("Erreur lors de la suppression de la règle");
            console.error(err);
        } finally {
            setDeleteDialogOpen(false);
            setRuleToDelete(null);
        }
    };

    const getSectorName = (sectorId?: string) => {
        if (!sectorId) return "Global";
        const sector = operatingRoomService.getSectorById(sectorId);
        return sector ? sector.nom : "Secteur inconnu";
    };

    const getRuleTypeBadge = (type: string) => {
        switch (type) {
            case 'BASIQUE':
                return <Badge className="bg-blue-100 text-blue-800">Standard</Badge>;
            case 'SPECIFIQUE':
                return <Badge className="bg-green-100 text-green-800">Spécifique</Badge>;
            case 'EXCEPTION':
                return <Badge className="bg-orange-100 text-orange-800">Exception</Badge>;
            default:
                return <Badge>Inconnu</Badge>;
        }
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive
            ? <Badge className="bg-green-100 text-green-800">Actif</Badge>
            : <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Règles de supervision du bloc opératoire</CardTitle>
                    <CardDescription>Gérez les règles de supervision et leurs paramètres</CardDescription>
                </div>
                <div className="space-x-2">
                    <Button
                        variant={conflicts.length > 0 ? "destructive" : "outline"}
                        onClick={() => setShowConflicts(!showConflicts)}
                    >
                        Conflits ({conflicts.length})
                    </Button>
                    <Button onClick={onAddRule}>Ajouter une règle</Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 py-2">{error}</div>
                ) : showConflicts && conflicts.length > 0 ? (
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-3">Conflits détectés</h3>
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <ul className="list-disc pl-5 space-y-2">
                                {conflicts.map((conflict, index) => (
                                    <li key={index} className="text-red-700">
                                        {conflict.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-4 mb-6 flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowConflicts(false)}
                            >
                                Masquer les conflits
                            </Button>
                        </div>
                    </div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Aucune règle de supervision n'a été configurée.
                        <div className="mt-2">
                            <Button variant="outline" onClick={onAddRule}>
                                Ajouter votre première règle
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Secteur</TableHead>
                                <TableHead>Max Salles</TableHead>
                                <TableHead>Priorité</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">
                                        {rule.nom}
                                        {rule.description && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {rule.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{getRuleTypeBadge(rule.type)}</TableCell>
                                    <TableCell>{getSectorName(rule.secteurId)}</TableCell>
                                    <TableCell>{rule.conditions.maxSallesParMAR}</TableCell>
                                    <TableCell>
                                        <Badge className="bg-gray-100 text-gray-800">
                                            {rule.priorite}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(rule.estActif)}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditRule(rule)}
                                            >
                                                Modifier
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteClick(rule)}
                                            >
                                                Supprimer
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la règle "{ruleToDelete?.nom}" ?
                                Cette action est irréversible et pourrait affecter le fonctionnement de la supervision.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
};

export default SupervisionRulesList; 