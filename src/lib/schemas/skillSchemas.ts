import { z } from 'zod';

export const skillIdSchema = z.object({
    skillId: z.string().cuid({ message: "L'identifiant de la compétence doit être un CUID valide." })
});

export const createSkillSchema = z.object({
    name: z.string().min(3, { message: "Le nom de la compétence doit contenir au moins 3 caractères." }).max(100, { message: "Le nom de la compétence ne peut pas dépasser 100 caractères." }),
    description: z.string().max(500, { message: "La description ne peut pas dépasser 500 caractères." }).optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;

export const updateSkillSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
});

export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;

// Schémas pour UserSkill
export const userIdSchema = z.object({
    userId: z.string().cuid({ message: "L'identifiant de l'utilisateur doit être un CUID valide." })
});

export const userSkillParamsSchema = z.object({
    userId: z.string().cuid({ message: "L'identifiant de l'utilisateur doit être un CUID valide." }),
    skillId: z.string().cuid({ message: "L'identifiant de la compétence doit être un CUID valide." })
});

export const assignSkillSchema = z.object({
    skillId: z.string().cuid({ message: "L'identifiant de la compétence est requis." }),
    // Pas d'autres champs car le niveau et la validation ont été simplifiés
});

export type AssignSkillInput = z.infer<typeof assignSkillSchema>; 