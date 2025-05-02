import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Theme } from '@/config/themes';

export const ThemeSelector: React.FC = () => {
    const { currentTheme, themes, changeTheme } = useTheme();

    return (
        <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Thème :</span>
            <select
                value={currentTheme.id}
                onChange={(e) => changeTheme(e.target.value)}
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
                {themes.map((theme: Theme) => (
                    <option key={theme.id} value={theme.id}>
                        {theme.name}
                    </option>
                ))}
            </select>
        </div>
    );
}; 