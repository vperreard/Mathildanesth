"use client";

import React, { useState } from 'react';
import { Check, ChevronsUpDown, X, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';

// Type pour les chirurgiens
interface Surgeon {
    id: number;
    firstName: string;
    lastName: string;
    specialtyId?: number;
    specialty?: {
        id: number;
        name: string;
    };
    email?: string;
    [key: string]: any;
}

interface SurgeonSelectProps {
    surgeons: Surgeon[] | undefined;
    selectedSurgeonIds: number[];
    onChange: (surgeonIds: number[]) => void;
    placeholder?: string;
    loading?: boolean;
    className?: string;
    error?: string;
    disabled?: boolean;
    maxDisplaySurgeons?: number;
    // Options de filtrage
    filterBySpecialtyIds?: number[];
    groupBySpecialty?: boolean;
}

export function SurgeonSelect({
    surgeons = [],
    selectedSurgeonIds = [],
    onChange,
    placeholder = "Sélectionner des chirurgiens",
    loading = false,
    className,
    error,
    disabled = false,
    maxDisplaySurgeons = 3,
    filterBySpecialtyIds,
    groupBySpecialty = false,
}: SurgeonSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filtrer les chirurgiens par recherche et spécialité
    const filteredSurgeons = surgeons
        ? surgeons
            .filter(surgeon =>
                (filterBySpecialtyIds ? (!surgeon.specialtyId || filterBySpecialtyIds.includes(surgeon.specialtyId)) : true) &&
                (searchQuery
                    ? `${surgeon.firstName} ${surgeon.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    surgeon.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    : true)
            )
            .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
        : [];

    // Grouper les chirurgiens par spécialité si requis
    const groupedSurgeons = groupBySpecialty
        ? filteredSurgeons.reduce<Record<string, Surgeon[]>>((groups, surgeon) => {
            // Utiliser le nom de la spécialité ou l'ID comme clé de groupe
            const groupKey = surgeon.specialty?.name || surgeon.specialtyId?.toString() || 'other';
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(surgeon);
            return groups;
        }, {})
        : null;

    // Basculer la sélection d'un chirurgien
    const toggleSurgeon = (surgeonId: number) => {
        const selectedIndex = selectedSurgeonIds.indexOf(surgeonId);

        if (selectedIndex >= 0) {
            // Désélectionner
            onChange([
                ...selectedSurgeonIds.slice(0, selectedIndex),
                ...selectedSurgeonIds.slice(selectedIndex + 1)
            ]);
        } else {
            // Sélectionner
            onChange([...selectedSurgeonIds, surgeonId]);
        }
    };

    // Obtenir les chirurgiens sélectionnés
    const selectedSurgeons = surgeons
        ? surgeons.filter(surgeon => selectedSurgeonIds.includes(surgeon.id))
        : [];

    // Limiter le nombre de chirurgiens affichés
    const displaySurgeons = selectedSurgeons.slice(0, maxDisplaySurgeons);
    const extraSurgeonsCount = selectedSurgeons.length - displaySurgeons.length;

    // Effacer tous les chirurgiens sélectionnés
    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
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
                            selectedSurgeons.length > 0 ? "h-auto" : "h-10"
                        )}
                        disabled={disabled}
                    >
                        <div className="flex flex-wrap gap-1 items-center">
                            {selectedSurgeons.length === 0 ? (
                                <span className="text-muted-foreground">{placeholder}</span>
                            ) : (
                                <>
                                    {displaySurgeons.map(surgeon => (
                                        <Badge
                                            key={surgeon.id}
                                            variant="secondary"
                                            className="mr-1 mb-1 pl-1 pr-1 flex items-center gap-1"
                                        >
                                            <Avatar className="h-5 w-5">
                                                <div className="h-full w-full flex items-center justify-center bg-primary text-[10px] text-primary-foreground">
                                                    {surgeon.firstName?.[0]}{surgeon.lastName?.[0]}
                                                </div>
                                            </Avatar>
                                            <span className="truncate max-w-[150px]">
                                                {surgeon.firstName} {surgeon.lastName}
                                            </span>
                                            <button
                                                className="ml-1 text-muted-foreground hover:text-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSurgeon(surgeon.id);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {extraSurgeonsCount > 0 && (
                                        <Badge variant="secondary" className="mb-1">
                                            +{extraSurgeonsCount}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex items-center">
                            {selectedSurgeonIds.length > 0 && (
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
                                placeholder="Rechercher un chirurgien..."
                                className="h-9 flex-1 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                        </div>
                        {loading ? (
                            <div className="py-6 text-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                                <p className="text-sm text-muted-foreground mt-2">Chargement des chirurgiens...</p>
                            </div>
                        ) : surgeons && surgeons.length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-sm text-muted-foreground">Aucun chirurgien disponible</p>
                            </div>
                        ) : filteredSurgeons.length === 0 ? (
                            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                        ) : (
                            <ScrollArea className="max-h-[300px] overflow-auto">
                                {groupedSurgeons ? (
                                    // Affichage groupé par spécialité
                                    Object.entries(groupedSurgeons).map(([specialtyName, surgeonsInSpecialty]) => (
                                        <CommandGroup key={specialtyName} heading={specialtyName === 'other' ? 'Autre' : specialtyName} className="py-1.5">
                                            {surgeonsInSpecialty.map(surgeon => (
                                                <CommandItem
                                                    key={surgeon.id}
                                                    value={`${surgeon.firstName} ${surgeon.lastName}`}
                                                    onSelect={() => toggleSurgeon(surgeon.id)}
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="flex-shrink-0">
                                                            <Avatar className="h-6 w-6">
                                                                <div className="h-full w-full flex items-center justify-center bg-primary text-[10px] text-primary-foreground">
                                                                    {surgeon.firstName?.[0]}{surgeon.lastName?.[0]}
                                                                </div>
                                                            </Avatar>
                                                        </div>
                                                        <div className="flex-grow truncate">
                                                            <span className="font-medium">{surgeon.lastName}</span>
                                                            {" "}
                                                            <span>{surgeon.firstName}</span>
                                                        </div>
                                                        <Check
                                                            className={cn(
                                                                "ml-auto flex-shrink-0",
                                                                selectedSurgeonIds.includes(surgeon.id)
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
                                        {filteredSurgeons.map(surgeon => (
                                            <CommandItem
                                                key={surgeon.id}
                                                value={`${surgeon.firstName} ${surgeon.lastName}`}
                                                onSelect={() => toggleSurgeon(surgeon.id)}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <div className="flex-shrink-0">
                                                        <Avatar className="h-6 w-6">
                                                            <div className="h-full w-full flex items-center justify-center bg-primary text-[10px] text-primary-foreground">
                                                                {surgeon.firstName?.[0]}{surgeon.lastName?.[0]}
                                                            </div>
                                                        </Avatar>
                                                    </div>
                                                    <div className="flex-grow truncate">
                                                        <span className="font-medium">{surgeon.lastName}</span>
                                                        {" "}
                                                        <span>{surgeon.firstName}</span>
                                                        {surgeon.specialty?.name && (
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                ({surgeon.specialty.name})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            "ml-auto flex-shrink-0",
                                                            selectedSurgeonIds.includes(surgeon.id)
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