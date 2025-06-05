'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';

export type MultiSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
    [key: string]: unknown; // Pour les métadonnées supplémentaires
};

export interface MultiSelectProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    className?: string;
    badgeClassName?: string;
    groups?: { [key: string]: string }; // Clé = valeur du groupe, Valeur = label à afficher
    loading?: boolean;
    maxDisplayItems?: number;
    maxHeight?: number;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Sélectionner...",
    searchPlaceholder = "Rechercher...",
    emptyMessage = "Aucun résultat trouvé",
    disabled = false,
    className,
    badgeClassName,
    groups,
    loading = false,
    maxDisplayItems = 3,
    maxHeight = 300,
}: MultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [triggerWidth, setTriggerWidth] = useState<number>(0);

    // Mettre à jour la largeur du trigger quand il change
    useEffect(() => {
        if (triggerRef.current) {
            setTriggerWidth(triggerRef.current.offsetWidth);
        }
    }, [triggerRef, open]);

    // Filtrer les options en fonction de la recherche
    const filteredOptions = searchQuery === ""
        ? options
        : options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // Organiser les options par groupe si les groupes sont fournis
    const groupedOptions = groups
        ? Object.entries(
            filteredOptions.reduce<Record<string, MultiSelectOption[]>>(
                (acc, option) => {
                    const groupKey = option.group || "undefined";
                    if (!acc[groupKey]) {
                        acc[groupKey] = [];
                    }
                    acc[groupKey].push(option);
                    return acc;
                },
                {}
            )
        ).sort(([keyA], [keyB]) => {
            // Mettre "undefined" à la fin
            if (keyA === "undefined") return 1;
            if (keyB === "undefined") return -1;
            return keyA.localeCompare(keyB);
        })
        : null;

    const handleSelect = (value: string) => {
        onChange(
            selected.includes(value)
                ? selected.filter((item) => item !== value)
                : [...selected, value]
        );
    };

    const handleRemove = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((item) => item !== value));
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    // Déterminer les badges à afficher
    const displayBadges = selected.map((value) => {
        const option = options.find((opt) => opt.value === value);
        return option ? option : { value, label: value };
    });

    // Limiter le nombre de badges affichés
    const displayedBadges = displayBadges.slice(0, maxDisplayItems);
    const extraBadgesCount = displayBadges.length - maxDisplayItems;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={triggerRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full min-h-10 h-auto justify-between", className)}
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
                        {selected.length === 0 ? (
                            <span className="text-muted-foreground">{placeholder}</span>
                        ) : (
                            <>
                                {displayedBadges.map((option) => (
                                    <Badge
                                        key={option.value}
                                        variant="secondary"
                                        className={cn("mr-1 mb-1", badgeClassName)}
                                    >
                                        {option.label}
                                        <button
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => handleRemove(option.value, e)}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </Badge>
                                ))}
                                {extraBadgesCount > 0 && (
                                    <Badge variant="secondary" className="mb-1">
                                        +{extraBadgesCount}
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex">
                        {selected.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 mr-2 hover:bg-background"
                                onClick={clearAll}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Tout effacer</span>
                            </Button>
                        )}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                style={{ width: `${Math.max(triggerWidth, 250)}px` }}
                align="start"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <ScrollArea className={`max-h-${maxHeight}px`}>
                        <CommandList>
                            {loading ? (
                                <div className="py-6 text-center text-sm">Chargement...</div>
                            ) : filteredOptions.length === 0 ? (
                                <CommandEmpty>{emptyMessage}</CommandEmpty>
                            ) : groupedOptions ? (
                                // Afficher les options regroupées
                                groupedOptions.map(([groupKey, groupOptions]) => (
                                    <CommandGroup
                                        key={groupKey}
                                        heading={groups && groups[groupKey] || "Non catégorisé"}
                                        className="py-1"
                                    >
                                        {groupOptions.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.value}
                                                onSelect={() => handleSelect(option.value)}
                                                disabled={option.disabled}
                                                className={cn(
                                                    option.disabled ? "opacity-50 cursor-not-allowed" : "",
                                                    "flex items-center gap-2"
                                                )}
                                            >
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4 flex-shrink-0",
                                                        selected.includes(option.value)
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                <span>{option.label}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                ))
                            ) : (
                                // Afficher les options sans regroupement
                                filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                        disabled={option.disabled}
                                        className={cn(
                                            option.disabled ? "opacity-50 cursor-not-allowed" : "",
                                            "flex items-center gap-2"
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "h-4 w-4 flex-shrink-0",
                                                selected.includes(option.value)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        <span>{option.label}</span>
                                    </CommandItem>
                                ))
                            )}
                        </CommandList>
                    </ScrollArea>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default MultiSelect; 