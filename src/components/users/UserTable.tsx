"use client";

import React, { useMemo } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { User } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash, LockOpen, Search } from 'lucide-react';

interface UserTableProps {
    users: User[];
    onEditUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onResetPassword?: (userId: string) => void;
    currentUserRole?: string;
    currentUserId?: string;
}

/**
 * Table d'utilisateurs simple et responsive
 */
export default function UserTable({
    users,
    onEditUser,
    onDeleteUser,
    onResetPassword,
    currentUserRole,
    currentUserId
}: UserTableProps) {
    const [globalFilter, setGlobalFilter] = React.useState('');

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
                cell: ({ row }) => <div className="text-xs font-mono">{row.getValue('id')}</div>,
                size: 80,
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
                size: 220,
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({ row }) => <div className="text-sm truncate">{row.getValue('email')}</div>,
                size: 200,
            },
            {
                accessorKey: 'sites',
                header: 'Sites',
                cell: ({ row }) => {
                    const user = row.original as any;
                    const sites = user.sites || [];

                    if (sites.length === 0) {
                        return <span className="text-gray-400 italic text-xs">Aucun site</span>;
                    }

                    return (
                        <div className="flex flex-wrap gap-1">
                            {sites.slice(0, 2).map((site: any) => (
                                <Badge
                                    key={site.id}
                                    variant="outline"
                                    className="text-xs px-1 py-0"
                                    title={site.name}
                                >
                                    {site.name.length > 8 ? site.name.slice(0, 8) + '...' : site.name}
                                </Badge>
                            ))}
                            {sites.length > 2 && (
                                <Badge variant="outline" className="text-xs px-1 py-0" title={`${sites.length - 2} autres sites`}>
                                    +{sites.length - 2}
                                </Badge>
                            )}
                        </div>
                    );
                },
                size: 160,
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
                size: 130,
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const user = row.original;
                    const canManage = canManageUser(user);

                    return (
                        <div className="flex justify-end space-x-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditUser(user)}
                                disabled={!canManage}
                                className="h-8 w-8 p-0"
                                title="Modifier l'utilisateur"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            {onResetPassword && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onResetPassword(user.id)}
                                    disabled={!canManage}
                                    className="h-8 w-8 p-0"
                                    title="Réinitialiser le mot de passe"
                                >
                                    <LockOpen className="h-4 w-4" />
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteUser(user.id)}
                                disabled={!canManage}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                                title="Supprimer l'utilisateur"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
                size: 140,
            },
        ],
        [onEditUser, onDeleteUser, onResetPassword, currentUserRole, currentUserId]
    );

    const table = useReactTable({
        data: users,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });

    return (
        <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Rechercher un utilisateur..."
                        value={globalFilter ?? ''}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="text-sm text-gray-500">
                    {table.getFilteredRowModel().rows.length} utilisateur{table.getFilteredRowModel().rows.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="w-full" style={{ minWidth: '930px' }}>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="bg-gray-50/80">
                                    {headerGroup.headers.map((header) => {
                                        const size = header.getSize();
                                        return (
                                            <TableHead
                                                key={header.id}
                                                className="bg-gray-50 font-semibold text-left px-4"
                                                style={{ width: `${size}px`, minWidth: `${size}px` }}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="hover:bg-gray-50/50"
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const size = cell.column.getSize();
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    className="py-3 px-4"
                                                    style={{ width: `${size}px`, minWidth: `${size}px` }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        Aucun utilisateur trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
} 