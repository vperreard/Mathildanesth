'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserSelectProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}

export function UserSelect({ value, onChange, placeholder = 'Sélectionner un utilisateur' }: UserSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="1">Utilisateur 1</SelectItem>
                <SelectItem value="2">Utilisateur 2</SelectItem>
            </SelectContent>
        </Select>
    );
}

export default UserSelect;