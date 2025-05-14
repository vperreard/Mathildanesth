import { Skill } from './skill'; // Importer le type Skill

export interface UserSkill {
    id: string; // ID de l'enregistrement UserSkill lui-même
    userId: string;
    skillId: string;
    assignedAt: string; // ou Date
    assignedBy?: string | null; // ID de l'admin qui a assigné
    skill: Skill; // Pour inclure les détails de la compétence associée
} 