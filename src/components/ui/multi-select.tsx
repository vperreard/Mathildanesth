'use client';

import * as React from 'react';
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export type Option = {
    label: string;
    value: string;
};

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    maxDisplay?: number;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    className,
    placeholder = "Sélectionner...",
    disabled = false,
    maxDisplay = 3,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleRemove = (value: string) => {
        onChange(selected.filter(item => item !== value));
    };

    const displayOptions = selected
        .map(value => options.find(option => option.value === value))
        .filter(Boolean) as Option[];

    const visibleOptions = displayOptions.slice(0, maxDisplay);
    const remainingCount = displayOptions.length - visibleOptions.length;

    return (
        <div className={cn("relative", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between",
                            selected.length > 0 ? "h-auto min-h-10" : "h-10",
                            "px-3 py-2"
                        )}
                        disabled={disabled}
                    >
                        <div className="flex flex-wrap gap-1 items-center">
                            {visibleOptions.length > 0 ? (
                                <>
                                    {visibleOptions.map(option => (
                                        <Badge
                                            key={option.value}
                                            variant="secondary"
                                            className="mr-1 mb-1"
                                        >
                                            {option.label}
                                            <button
                                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleRemove(option.value);
                                                    }
                                                }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemove(option.value);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {remainingCount > 0 && (
                                        <Badge variant="secondary" className="mb-1">
                                            +{remainingCount}
                                        </Badge>
                                    )}
                                </>
                            ) : (
                                <span className="text-muted-foreground">{placeholder}</span>
                            )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Rechercher..." />
                        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                        <CommandList>
                            <CommandGroup>
                                {options.map(option => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                    >
                                        <div className="flex items-center">
                                            <div
                                                className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    selected.includes(option.value)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "opacity-50"
                                                )}
                                            >
                                                {selected.includes(option.value) && (
                                                    <Check className="h-3 w-3" />
                                                )}
                                            </div>
                                            <span>{option.label}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default MultiSelect; 