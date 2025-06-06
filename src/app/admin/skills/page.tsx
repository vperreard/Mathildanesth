'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { logger } from "../../../lib/logger";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

// Types (ceux-ci pourraient être centralisés si utilisés ailleurs)
interface Skill {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string; // ou Date
    updatedAt: string; // ou Date
}

export default function AdminSkillsPage() {
    const { toast } = useToast();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [currentSkill, setCurrentSkill] = useState<Skill | null>(null);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillDescription, setNewSkillDescription] = useState('');

    // Fetch skills
    async function fetchSkills() {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/skills');
            if (!response.ok) throw new Error('Failed to fetch skills');
            const data = await response.json();
            setSkills(data);
        } catch (error: unknown) {
            logger.error(error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les compétences.",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchSkills();
    }, []);

    const handleCreateSkill = async () => {
        if (!newSkillName.trim()) {
            toast({ title: "Validation", description: "Le nom de la compétence est requis.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch('http://localhost:3000/api/skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSkillName, description: newSkillDescription }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create skill');
            }
            await fetchSkills(); // Refresh list
            toast({ title: "Succès", description: "Compétence créée avec succès." });
            setShowCreateDialog(false);
            setNewSkillName('');
            setNewSkillDescription('');
        } catch (error: unknown) {
            toast({ title: "Erreur", description: error.message || "Impossible de créer la compétence.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    const handleEditSkill = async () => {
        if (!currentSkill || !currentSkill.name.trim()) {
            toast({ title: "Validation", description: "Le nom de la compétence est requis.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch(`http://localhost:3000/api/skills/${currentSkill.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: currentSkill.name, description: currentSkill.description }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update skill');
            }
            await fetchSkills();
            toast({ title: "Succès", description: "Compétence mise à jour avec succès." });
            setShowEditDialog(false);
        } catch (error: unknown) {
            toast({ title: "Erreur", description: error.message || "Impossible de mettre à jour la compétence.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    const handleDeleteSkill = async () => {
        if (!currentSkill) return;
        setIsSaving(true);
        try {
            const response = await fetch(`http://localhost:3000/api/skills/${currentSkill.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete skill');
            }
            await fetchSkills();
            toast({ title: "Succès", description: "Compétence supprimée avec succès." });
            setShowDeleteDialog(false);
        } catch (error: unknown) {
            toast({ title: "Erreur", description: error.message || "Impossible de supprimer la compétence.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    const openEditDialog = (skill: Skill) => {
        setCurrentSkill(JSON.parse(JSON.stringify(skill))); // Deep copy pour éviter la mutation directe
        setShowEditDialog(true);
    };

    const openDeleteDialog = (skill: Skill) => {
        setCurrentSkill(skill);
        setShowDeleteDialog(true);
    };

    // Animation variants
    const animationVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (isLoading && skills.length === 0) {
        return <div className="p-6"><p>Chargement des compétences...</p></div>;
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            className="container mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md"
        >
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Gestion des Compétences</h1>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-primary-600 hover:bg-primary-700">
                    <PlusCircle className="mr-2 h-5 w-5" /> Nouvelle Compétence
                </Button>
            </div>

            {/* Create Skill Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Créer une nouvelle compétence</DialogTitle>
                        <DialogDescription>
                            Ajoutez une nouvelle compétence au référentiel.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input
                            placeholder="Nom de la compétence (ex: Intubation difficile)"
                            value={newSkillName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSkillName(e.target.value)}
                            className="col-span-3"
                        />
                        <Textarea
                            placeholder="Description (optionnel)"
                            value={newSkillDescription}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewSkillDescription(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSaving}>Annuler</Button>
                        <Button onClick={handleCreateSkill} disabled={isSaving} className="bg-primary-600 hover:bg-primary-700">
                            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Skill Dialog */}
            {currentSkill && (
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Modifier la compétence</DialogTitle>
                            <DialogDescription>
                                Mettez à jour les informations de la compétence.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input
                                placeholder="Nom de la compétence"
                                value={currentSkill.name}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentSkill({ ...currentSkill, name: e.target.value })}
                                className="col-span-3"
                            />
                            <Textarea
                                placeholder="Description (optionnel)"
                                value={currentSkill.description || ''}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentSkill({ ...currentSkill, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSaving}>Annuler</Button>
                            <Button onClick={handleEditSkill} disabled={isSaving} className="bg-primary-600 hover:bg-primary-700">
                                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Skill Confirmation Dialog */}
            {currentSkill && (
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirmer la suppression</DialogTitle>
                            <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer la compétence "{currentSkill.name}"? Cette action est irréversible.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-end">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSaving}>Annuler</Button>
                            </DialogClose>
                            <Button type="button" variant="destructive" onClick={handleDeleteSkill} disabled={isSaving}>
                                {isSaving ? 'Suppression...' : 'Supprimer'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Skills Table */}
            <AnimatePresence>
                {skills.length === 0 && !isLoading ? (
                    <motion.p variants={animationVariants} className="text-center text-gray-500 py-8">Aucune compétence trouvée.</motion.p>
                ) : (
                    <motion.div variants={animationVariants} className="overflow-x-auto rounded-lg border border-gray-200/60 shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">Nom</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {skills.map((skill) => (
                                    <TableRow key={skill.id}>
                                        <TableCell className="font-medium">{skill.name}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{skill.description || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(skill)} className="hover:text-primary-600">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(skill)} className="hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
} 