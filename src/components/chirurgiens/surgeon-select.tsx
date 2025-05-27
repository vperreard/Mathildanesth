'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SurgeonSelectProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}

export function SurgeonSelect({ value, onChange, placeholder = 'Sélectionner un chirurgien' }: SurgeonSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="1">Dr. Dupont</SelectItem>
                <SelectItem value="2">Dr. Martin</SelectItem>
            </SelectContent>
        </Select>
    );
}

export default SurgeonSelect;