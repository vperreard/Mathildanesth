"use client";

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/types/user';
import { VirtualTable } from '@/components/ui/virtual-table';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Pencil, Trash, LockOpen } from 'lucide-react';

interface UserTableProps {
    users: User[];
    onEditUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onResetPassword?: (userId: string) => void;
    currentUserRole?: string;
    currentUserId?: string;
}

/**
 * Table virtualisée d'utilisateurs optimisée pour afficher des milliers d'entrées
 * sans impacter les performances
 */
export default function UserTable({
    users,
    onEditUser,
    onDeleteUser,
    onResetPassword,
    currentUserRole,
    currentUserId
}: UserTableProps) {
    // Détermine si l'utilisateur peut éditer/supprimer un autre utilisateur
    const canManageUser = (targetUser: User): boolean => {
        if (!currentUserRole || !currentUserId) return false;

        // Si c'est l'utilisateur lui-même
        const isSelf = currentUserId === targetUser.id;

        // Conditions basées sur les rôles
        const isTargetAdminTotal = targetUser.role === 'ADMIN_TOTAL';
        const isCurrentUserAdminTotal = currentUserRole === 'ADMIN_TOTAL';
        const isCurrentUserAdminPartiel = currentUserRole === 'ADMIN_PARTIEL';

        // Un admin total peut tout gérer sauf lui-même
        if (isCurrentUserAdminTotal) return !isSelf;

        // Un admin partiel peut gérer les utilisateurs standards mais pas les admins
        if (isCurrentUserAdminPartiel) return !isTargetAdminTotal && !isSelf;

        // Un utilisateur standard ne peut rien gérer
        return false;
    };

    // Déterminer la couleur du badge en fonction du rôle
    const getRoleBadgeColor = (role: string): string => {
        switch (role) {
            case 'ADMIN_TOTAL':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'ADMIN_PARTIEL':
                return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'USER':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    // Définir les colonnes
    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                accessorKey: 'id',
                header: 'ID',
                cell: ({ row }) => <div className="text-xs">{row.getValue('id')}</div>,
                size: 60,
            },
            {
                accessorFn: (row) => `${row.nom || ''} ${row.prenom || ''}`.trim(),
                id: 'fullName',
                header: 'Nom complet',
                cell: ({ row }) => {
                    const fullName = row.getValue('fullName') as string;
                    return (
                        <div className="font-medium">
                            {fullName || <span className="text-gray-400 italic">Non spécifié</span>}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({ row }) => <div>{row.getValue('email')}</div>,
            },
            {
                accessorKey: 'role',
                header: 'Rôle',
                cell: ({ row }) => {
                    const role = row.getValue('role') as string;
                    const displayRole = role === 'ADMIN_TOTAL'
                        ? 'Admin Total'
                        : role === 'ADMIN_PARTIEL'
                            ? 'Admin Partiel'
                            : 'Utilisateur';

                    return (
                        <Badge className={getRoleBadgeColor(role)}>
                            {displayRole}
                        </Badge>
                    );
                },
                size: 120,
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const user = row.original;
                    const canManage = canManageUser(user);

                    return (
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditUser(user)}
                                disabled={!canManage}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            {onResetPassword && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onResetPassword(user.id)}
                                    disabled={!canManage}
                                >
                                    <LockOpen className="h-4 w-4" />
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteUser(user.id)}
                                disabled={!canManage}
                                className="text-red-600 hover:text-red-800 hover:bg-red-100"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
                size: 120,
            },
        ],
        [onEditUser, onDeleteUser, onResetPassword, currentUserRole, currentUserId]
    );

    return (
        <VirtualTable
            columns={columns}
            data={users}
            searchKey="fullName"
            pagination={false}
            height={500}
            rowHeight={48}
        />
    );
} 