"use client";

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { User } from '@/types';

interface UserSelectProps {
    users: User[] | undefined;
    selectedUserIds: number[];
    onChange: (userIds: number[]) => void;
    placeholder?: string;
    loading?: boolean;
    className?: string;
    error?: string;
    disabled?: boolean;
    maxDisplayUsers?: number;
    // Options de filtrage
    filterByRoles?: string[];
    groupByRoles?: boolean;
}

export function UserSelect({
    users = [],
    selectedUserIds = [],
    onChange,
    placeholder = "Sélectionner des utilisateurs",
    loading = false,
    className,
    error,
    disabled = false,
    maxDisplayUsers = 3,
    filterByRoles,
    groupByRoles = false,
}: UserSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filtrer les utilisateurs par recherche et rôles
    const filteredUsers = users
        ? users
            .filter(user =>
                (filterByRoles ? filterByRoles.includes(user.role) : true) &&
                (searchQuery
                    ? `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    : true)
            )
            .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
        : [];

    // Grouper les utilisateurs par rôle si requis
    const groupedUsers = groupByRoles
        ? filteredUsers.reduce<Record<string, User[]>>((groups, user) => {
            const role = user.role || 'other';
            if (!groups[role]) {
                groups[role] = [];
            }
            groups[role].push(user);
            return groups;
        }, {})
        : null;

    // Conversion de l'ID utilisateur en un format uniforme
    const userIdToNumber = (id: string | number): number => {
        return typeof id === 'string' ? parseInt(id, 10) : id;
    };

    // Basculer la sélection d'un utilisateur
    const toggleUser = (userId: number) => {
        const numericId = userIdToNumber(userId);
        const selectedIndex = selectedUserIds.findIndex(id => userIdToNumber(id) === numericId);

        if (selectedIndex >= 0) {
            // Désélectionner
            onChange([
                ...selectedUserIds.slice(0, selectedIndex),
                ...selectedUserIds.slice(selectedIndex + 1)
            ]);
        } else {
            // Sélectionner
            onChange([...selectedUserIds, numericId]);
        }
    };

    // Obtenir les utilisateurs sélectionnés
    const selectedUsers = users
        ? users.filter(user => selectedUserIds.includes(userIdToNumber(user.id)))
        : [];

    // Limiter le nombre d'utilisateurs affichés
    const displayUsers = selectedUsers.slice(0, maxDisplayUsers);
    const extraUsersCount = selectedUsers.length - displayUsers.length;

    // Effacer tous les utilisateurs sélectionnés
    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    // Obtenir le nom du rôle
    const getRoleName = (role: string): string => {
        const roleNames: Record<string, string> = {
            'ADMIN': 'Administrateur',
            'MAR': 'Anesthésiste',
            'IADE': 'IADE',
            'OTHER': 'Autre',
            'other': 'Autre'
        };
        return roleNames[role] || role;
    };

    return (
        <div className={cn("w-full relative", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between min-h-[40px]",
                            error ? "border-red-500" : "",
                            selectedUsers.length > 0 ? "h-auto" : "h-10"
                        )}
                        disabled={disabled}
                    >
                        <div className="flex flex-wrap gap-1 items-center">
                            {selectedUsers.length === 0 ? (
                                <span className="text-muted-foreground">{placeholder}</span>
                            ) : (
                                <>
                                    {displayUsers.map(user => (
                                        <Badge
                                            key={user.id}
                                            variant="secondary"
                                            className="mr-1 mb-1 pl-1 pr-1 flex items-center gap-1"
                                        >
                                            <Avatar className="h-5 w-5">
                                                <div className="h-full w-full flex items-center justify-center bg-primary text-[10px] text-primary-foreground">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </div>
                                            </Avatar>
                                            <span className="truncate max-w-[150px]">
                                                {user.firstName} {user.lastName}
                                            </span>
                                            <button
                                                className="ml-1 text-muted-foreground hover:text-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleUser(userIdToNumber(user.id));
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {extraUsersCount > 0 && (
                                        <Badge variant="secondary" className="mb-1">
                                            +{extraUsersCount}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex items-center">
                            {selectedUserIds.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={clearSelection}
                                    className="h-6 w-6 p-0 mr-1 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Effacer la sélection</span>
                                </Button>
                            )}
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <div className="flex items-center border-b px-3">
                            <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
                            <CommandInput
                                placeholder="Rechercher un utilisateur..."
                                className="h-9 flex-1 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                        </div>
                        {loading ? (
                            <div className="py-6 text-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                                <p className="text-sm text-muted-foreground mt-2">Chargement des utilisateurs...</p>
                            </div>
                        ) : users && users.length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-sm text-muted-foreground">Aucun utilisateur disponible</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                        ) : (
                            <ScrollArea className="max-h-[300px] overflow-auto">
                                {groupedUsers ? (
                                    // Affichage groupé par rôle
                                    Object.entries(groupedUsers).map(([role, usersInRole]) => (
                                        <CommandGroup key={role} heading={getRoleName(role)} className="py-1.5">
                                            {usersInRole.map(user => (
                                                <CommandItem
                                                    key={user.id}
                                                    value={`${user.firstName} ${user.lastName}`}
                                                    onSelect={() => toggleUser(userIdToNumber(user.id))}
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="flex-shrink-0">
                                                            <Avatar className="h-6 w-6">
                                                                <div className="h-full w-full flex items-center justify-center bg-primary text-[10px] text-primary-foreground">
                                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                                </div>
                                                            </Avatar>
                                                        </div>
                                                        <div className="flex-grow truncate">
                                                            <span className="font-medium">{user.lastName}</span>
                                                            {" "}
                                                            <span>{user.firstName}</span>
                                                        </div>
                                                        <Check
                                                            className={cn(
                                                                "ml-auto flex-shrink-0",
                                                                selectedUserIds.includes(userIdToNumber(user.id))
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    ))
                                ) : (
                                    // Affichage simple
                                    <CommandGroup>
                                        {filteredUsers.map(user => (
                                            <CommandItem
                                                key={user.id}
                                                value={`${user.firstName} ${user.lastName}`}
                                                onSelect={() => toggleUser(userIdToNumber(user.id))}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <div className="flex-shrink-0">
                                                        <Avatar className="h-6 w-6">
                                                            <div className="h-full w-full flex items-center justify-center bg-primary text-[10px] text-primary-foreground">
                                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                                            </div>
                                                        </Avatar>
                                                    </div>
                                                    <div className="flex-grow truncate">
                                                        <span className="font-medium">{user.lastName}</span>
                                                        {" "}
                                                        <span>{user.firstName}</span>
                                                        {user.role && (
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                ({getRoleName(user.role)})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            "ml-auto flex-shrink-0",
                                                            selectedUserIds.includes(userIdToNumber(user.id))
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </ScrollArea>
                        )}
                    </Command>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
} 