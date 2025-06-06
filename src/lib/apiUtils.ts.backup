import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions'; // Chemin direct vers vos authOptions
import { Role } from '@prisma/client'; // Importer Role si ce n'est pas déjà fait

export function handleApiError(
  error: unknown,
  defaultMessage: string = 'Une erreur est survenue.'
) {
  // ... existing code ...
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  // session.user peut être undefined si non connecté
  // et les propriétés id/role sont typées grâce à next-auth.d.ts
  if (session?.user) {
    return session.user as {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
  return undefined; // Ou null, selon la préférence pour un utilisateur non connecté
}

export function isAdmin(user: { role: Role } | undefined | null): boolean {
  if (!user || !user.role) return false;
  // Comparer avec les valeurs de l'enum Role
  return user.role === Role.ADMIN_TOTAL || user.role === Role.ADMIN_PARTIEL;
}
