'use client';

import { useState } from 'react';
import { Card, Badge, Button, Textarea, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui';
import { BlocPlanningStatus } from '@/modules/planning/bloc-operatoire/models/BlocModels';

interface PlanningValidationPanelProps {
    planningId: string;
    currentStatus: BlocPlanningStatus;
    onStatusChange: (status: BlocPlanningStatus, comment: string) => Promise<void>;
    lastUpdateBy?: string;
    lastUpdateDate?: Date;
    validationErrors?: Array<{ message: string; severity: 'warning' | 'error' }>;
}

export default function PlanningValidationPanel({
    planningId,
    currentStatus,
    onStatusChange,
    lastUpdateBy,
    lastUpdateDate,
    validationErrors = []
}: PlanningValidationPanelProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasBlockingErrors = validationErrors.some(error => error.severity === 'error');

    const getStatusBadge = (status: BlocPlanningStatus) => {
        switch (status) {
            case BlocPlanningStatus.DRAFT:
                return <Badge variant="warning">Brouillon</Badge>;
            case BlocPlanningStatus.APPROVED:
                return <Badge variant="success">Approuvé</Badge>;
            case BlocPlanningStatus.REJECTED:
                return <Badge variant="destructive">Rejeté</Badge>;
            case BlocPlanningStatus.PENDING_CHANGES:
                return <Badge variant="warning">Modifications en attente</Badge>;
            default:
                return <Badge>Inconnu</Badge>;
        }
    };

    const handleStatusChange = async (newStatus: BlocPlanningStatus) => {
        setIsLoading(true);
        setError(null);
        try {
            await onStatusChange(newStatus, comment);
            setComment('');

            // Fermer le dialogue approprié
            if (newStatus === BlocPlanningStatus.APPROVED) {
                setShowApproveDialog(false);
            } else if (newStatus === BlocPlanningStatus.REJECTED) {
                setShowRejectDialog(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="p-5 space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Validation du planning</h2>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Statut actuel:</span>
                        {getStatusBadge(currentStatus)}
                    </div>
                    {lastUpdateBy && lastUpdateDate && (
                        <p className="text-sm text-gray-500">
                            Dernière mise à jour par {lastUpdateBy} le {new Date(lastUpdateDate).toLocaleString('fr-FR')}
                        </p>
                    )}
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowRejectDialog(true)}
                        disabled={isLoading || currentStatus === BlocPlanningStatus.REJECTED}
                    >
                        Rejeter
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => setShowApproveDialog(true)}
                        disabled={isLoading || hasBlockingErrors || currentStatus === BlocPlanningStatus.APPROVED}
                    >
                        Approuver
                    </Button>
                </div>
            </div>

            {validationErrors.length > 0 && (
                <div className="space-y-2 mt-4">
                    <h3 className="font-medium">Problèmes détectés:</h3>
                    <ul className="space-y-1">
                        {validationErrors.map((error, index) => (
                            <li
                                key={index}
                                className={`text-sm py-1 px-2 rounded-md ${error.severity === 'error'
                                        ? 'bg-red-50 text-red-800 border-l-2 border-red-500'
                                        : 'bg-yellow-50 text-yellow-800 border-l-2 border-yellow-500'
                                    }`}
                            >
                                {error.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm mt-4">
                    {error}
                </div>
            )}

            {/* Dialogue de rejet */}
            <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rejeter ce planning ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Veuillez fournir un commentaire expliquant les raisons du rejet.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-3">
                        <Textarea
                            placeholder="Commentaire (obligatoire)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            onClick={() => handleStatusChange(BlocPlanningStatus.REJECTED)}
                            disabled={isLoading || !comment.trim()}
                        >
                            {isLoading ? 'Chargement...' : 'Rejeter'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialogue d'approbation */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approuver ce planning ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Une fois approuvé, le planning sera visible par tous les utilisateurs et considéré comme définitif.
                            {validationErrors.length > 0 && validationErrors.every(e => e.severity === 'warning') && (
                                <div className="mt-2 text-yellow-600 font-medium">
                                    Attention : Des avertissements ont été détectés. Vous pouvez tout de même approuver ce planning.
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-3">
                        <Textarea
                            placeholder="Commentaire (facultatif)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
                            onClick={() => handleStatusChange(BlocPlanningStatus.APPROVED)}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Chargement...' : 'Approuver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
} 