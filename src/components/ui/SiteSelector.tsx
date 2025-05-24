'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Site {
    id: string;
    name: string;
    description?: string;
    colorCode?: string;
    isActive: boolean;
}

interface SiteSelectorProps {
    selectedSites: Site[];
    onSitesChange: (sites: Site[]) => void;
    availableSites?: Site[];
    loading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    multiple?: boolean;
    required?: boolean;
    showDescription?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const SiteSelector: React.FC<SiteSelectorProps> = ({
    selectedSites,
    onSitesChange,
    availableSites = [],
    loading = false,
    disabled = false,
    placeholder = 'Sélectionner des sites...',
    className = '',
    multiple = true,
    required = false,
    showDescription = true,
    size = 'md'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sites, setSites] = useState<Site[]>([]);
    const [loadingSites, setLoadingSites] = useState(false);

    // Charger les sites disponibles si pas fournis
    useEffect(() => {
        if (availableSites.length === 0) {
            fetchSites();
        } else {
            setSites(availableSites);
        }
    }, [availableSites]);

    const fetchSites = async () => {
        try {
            setLoadingSites(true);
            const response = await fetch('/api/sites');
            if (response.ok) {
                const data = await response.json();
                setSites(data.sites || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des sites:', error);
        } finally {
            setLoadingSites(false);
        }
    };

    const filteredSites = sites.filter(site =>
        site.isActive &&
        (site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            site.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSiteToggle = (site: Site) => {
        if (!multiple) {
            onSitesChange([site]);
            setIsOpen(false);
            return;
        }

        const isSelected = selectedSites.some(s => s.id === site.id);
        if (isSelected) {
            onSitesChange(selectedSites.filter(s => s.id !== site.id));
        } else {
            onSitesChange([...selectedSites, site]);
        }
    };

    const removeSite = (siteId: string) => {
        onSitesChange(selectedSites.filter(s => s.id !== siteId));
    };

    const clearAll = () => {
        onSitesChange([]);
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return {
                    button: 'py-1.5 px-2 text-sm',
                    dropdown: 'text-sm',
                    tag: 'px-2 py-0.5 text-xs'
                };
            case 'lg':
                return {
                    button: 'py-3 px-4 text-lg',
                    dropdown: 'text-base',
                    tag: 'px-3 py-1 text-sm'
                };
            default:
                return {
                    button: 'py-2 px-3 text-base',
                    dropdown: 'text-sm',
                    tag: 'px-2.5 py-0.5 text-sm'
                };
        }
    };

    const sizeClasses = getSizeClasses();
    const isLoading = loading || loadingSites;

    return (
        <div className={`relative ${className}`}>
            {/* Bouton principal */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || isLoading}
                className={`
                    relative w-full ${sizeClasses.button} border border-gray-300 bg-white 
                    rounded-md shadow-sm pl-3 pr-10 text-left cursor-default 
                    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}
                    ${isOpen ? 'ring-1 ring-blue-500 border-blue-500' : ''}
                `}
            >
                <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
                    {selectedSites.length === 0 ? (
                        <span className="text-gray-500">{placeholder}</span>
                    ) : (
                        selectedSites.map(site => (
                            <span
                                key={site.id}
                                className={`
                                    inline-flex items-center gap-1 ${sizeClasses.tag}
                                    bg-blue-100 text-blue-800 rounded-md font-medium
                                `}
                                style={site.colorCode ? {
                                    backgroundColor: site.colorCode + '20',
                                    color: site.colorCode
                                } : {}}
                            >
                                {site.name}
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeSite(site.id);
                                        }}
                                        className="hover:text-red-600 ml-1"
                                    >
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                )}
                            </span>
                        ))
                    )}
                </div>

                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    ) : (
                        <ChevronDownIcon
                            className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''
                                }`}
                        />
                    )}
                </div>
            </button>

            {/* Menu déroulant */}
            {isOpen && !disabled && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    {/* Barre de recherche */}
                    <div className="sticky top-0 bg-white p-2 border-b">
                        <input
                            type="text"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Rechercher un site..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {multiple && selectedSites.length > 0 && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="mt-1 text-xs text-red-600 hover:text-red-800"
                            >
                                Tout désélectionner
                            </button>
                        )}
                    </div>

                    {/* Liste des sites */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredSites.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500 text-center">
                                {searchTerm ? 'Aucun site trouvé' : 'Aucun site disponible'}
                            </div>
                        ) : (
                            filteredSites.map(site => {
                                const isSelected = selectedSites.some(s => s.id === site.id);
                                return (
                                    <button
                                        key={site.id}
                                        type="button"
                                        onClick={() => handleSiteToggle(site)}
                                        className={`
                                            w-full text-left px-3 py-2 ${sizeClasses.dropdown}
                                            hover:bg-blue-50 focus:outline-none focus:bg-blue-50
                                            ${isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {site.colorCode && (
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: site.colorCode }}
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-medium">{site.name}</div>
                                                    {showDescription && site.description && (
                                                        <div className="text-gray-500 text-xs">
                                                            {site.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {multiple && isSelected && (
                                                <div className="text-blue-600">✓</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Clic à l'extérieur pour fermer */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default SiteSelector; 