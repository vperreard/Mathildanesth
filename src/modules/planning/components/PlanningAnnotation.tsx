'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Textarea, Avatar, Tooltip, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui';
import { MessageSquare, Edit, Trash2, PlusCircle } from 'lucide-react';

interface Annotation {
    id: string;
    planningId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
    targetDate?: string | Date;
    type: 'general' | 'room' | 'surgeon';
    targetId?: string;
    targetName?: string;
}

interface PlanningAnnotationProps {
    planningId: string;
    currentUserId: string;
    currentUserName: string;
    currentUserAvatar?: string;
    selectedDate?: Date;
    annotations: Annotation[];
    onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Annotation>;
    onUpdateAnnotation: (id: string, content: string) => Promise<Annotation>;
    onDeleteAnnotation: (id: string) => Promise<void>;
    targets?: Array<{
        id: string;
        name: string;
        type: 'room' | 'surgeon';
    }>;
}

export default function PlanningAnnotation({
    planningId,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    selectedDate,
    annotations,
    onAddAnnotation,
    onUpdateAnnotation,
    onDeleteAnnotation,
    targets = []
}: PlanningAnnotationProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [newAnnotation, setNewAnnotation] = useState('');
    const [editAnnotation, setEditAnnotation] = useState<{ id: string; content: string } | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [annotationType, setAnnotationType] = useState<'general' | 'room' | 'surgeon'>('general');
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    useEffect(() => {
        // Reset form when dialog is closed
        if (!isAddDialogOpen) {
            setNewAnnotation('');
            setAnnotationType('general');
            setSelectedTarget(null);
        }
    }, [isAddDialogOpen]);

    const handleAddAnnotation = async () => {
        if (!newAnnotation.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const targetObj = targets.find(t => t.id === selectedTarget);
            await onAddAnnotation({
                planningId,
                userId: currentUserId,
                userName: currentUserName,
                userAvatar: currentUserAvatar,
                content: newAnnotation,
                type: annotationType,
                targetId: annotationType !== 'general' ? selectedTarget || undefined : undefined,
                targetName: targetObj?.name,
                targetDate: selectedDate
            });

            setNewAnnotation('');
            setAnnotationType('general');
            setSelectedTarget(null);
            setIsAddDialogOpen(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du commentaire');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateAnnotation = async () => {
        if (!editAnnotation || !editAnnotation.content.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            await onUpdateAnnotation(editAnnotation.id, editAnnotation.content);
            setEditAnnotation(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du commentaire');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAnnotation = async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await onDeleteAnnotation(id);
            setDeleteConfirmation(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du commentaire');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        return d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredAnnotations = annotations
        .filter(a => !selectedDate || !a.targetDate || new Date(a.targetDate).toDateString() === selectedDate.toDateString())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const getTargetsByType = (type: 'room' | 'surgeon') => {
        return targets.filter(t => t.type === type);
    };

    const rooms = getTargetsByType('room');
    const surgeons = getTargetsByType('surgeon');

    return (
        <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <MessageSquare size={20} />
                    <h2 className="text-xl font-semibold">Commentaires et annotations</h2>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-2">
                            <PlusCircle size={16} />
                            Ajouter
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Ajouter un commentaire</DialogTitle>
                            <DialogDescription>
                                Ajoutez un commentaire général ou concernant une ressource spécifique.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Type de commentaire</label>
                                <select
                                    value={annotationType}
                                    onChange={(e) => {
                                        setAnnotationType(e.target.value as 'general' | 'room' | 'surgeon');
                                        setSelectedTarget(null);
                                    }}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="general">Général</option>
                                    {rooms.length > 0 && <option value="room">Salle</option>}
                                    {surgeons.length > 0 && <option value="surgeon">Chirurgien</option>}
                                </select>
                            </div>

                            {annotationType !== 'general' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {annotationType === 'room' ? 'Salle concernée' : 'Chirurgien concerné'}
                                    </label>
                                    <select
                                        value={selectedTarget || ''}
                                        onChange={(e) => setSelectedTarget(e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {annotationType === 'room' && rooms.map(room => (
                                            <option key={room.id} value={room.id}>{room.name}</option>
                                        ))}
                                        {annotationType === 'surgeon' && surgeons.map(surgeon => (
                                            <option key={surgeon.id} value={surgeon.id}>{surgeon.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Commentaire</label>
                                <Textarea
                                    value={newAnnotation}
                                    onChange={(e) => setNewAnnotation(e.target.value)}
                                    placeholder="Saisissez votre commentaire ici..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                                {error}
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button
                                onClick={handleAddAnnotation}
                                disabled={isLoading || !newAnnotation.trim() || (annotationType !== 'general' && !selectedTarget)}
                            >
                                {isLoading ? 'Chargement...' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {filteredAnnotations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    Aucun commentaire pour le moment
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAnnotations.map((annotation) => (
                        <div key={annotation.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        {annotation.userAvatar ? (
                                            <Avatar.Image src={annotation.userAvatar} alt={annotation.userName} />
                                        ) : (
                                            <Avatar.Fallback>{annotation.userName.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <span className="font-medium">{annotation.userName}</span>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{formatDate(annotation.createdAt)}</span>
                                            {annotation.updatedAt && (
                                                <Tooltip content="Modifié le">
                                                    <span>(édité)</span>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {annotation.userId === currentUserId && (
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditAnnotation({ id: annotation.id, content: annotation.content })}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => setDeleteConfirmation(annotation.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {annotation.type !== 'general' && annotation.targetName && (
                                <div className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 inline-block rounded">
                                    {annotation.type === 'room' ? 'Salle' : 'Chirurgien'}: {annotation.targetName}
                                </div>
                            )}

                            {editAnnotation && editAnnotation.id === annotation.id ? (
                                <div className="space-y-2">
                                    <Textarea
                                        value={editAnnotation.content}
                                        onChange={(e) => setEditAnnotation({ ...editAnnotation, content: e.target.value })}
                                        className="min-h-[80px]"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditAnnotation(null)}
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleUpdateAnnotation}
                                            disabled={isLoading || !editAnnotation.content.trim()}
                                        >
                                            Enregistrer
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap">{annotation.content}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Confirmation de suppression */}
            <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteConfirmation && handleDeleteAnnotation(deleteConfirmation)}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Suppression...' : 'Supprimer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
} 