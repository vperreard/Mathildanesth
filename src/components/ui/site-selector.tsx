import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface Site {
    id: string;
    name: string;
    description?: string;
    isActive?: boolean;
    colorCode?: string;
}

interface SiteSelectorProps {
    sites: Site[];
    selectedSiteId: string | null;
    onChange: (siteId: string | null) => void;
    className?: string;
    includeAllSites?: boolean;
    allSitesLabel?: string;
    disabled?: boolean;
    autoSelectFirst?: boolean;
    persistInUrl?: boolean;
    urlParamName?: string;
}

export default function SiteSelector({
    sites = [],
    selectedSiteId,
    onChange,
    className = '',
    includeAllSites = true,
    allSitesLabel = 'Tous les sites',
    disabled = false,
    autoSelectFirst = false,
    persistInUrl = false,
    urlParamName = 'siteId'
}: SiteSelectorProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [initialized, setInitialized] = useState(false);

    // Initialisation du sélecteur avec la valeur de l'URL ou auto-sélection du premier site
    useEffect(() => {
        if (initialized) return;

        if (persistInUrl && searchParams) {
            const siteIdFromUrl = searchParams.get(urlParamName);
            if (siteIdFromUrl) {
                onChange(siteIdFromUrl);
                setInitialized(true);
                return;
            }
        }

        if (autoSelectFirst && sites.length > 0 && !selectedSiteId) {
            onChange(sites[0].id);
        }

        setInitialized(true);
    }, [sites, selectedSiteId, onChange, autoSelectFirst, persistInUrl, searchParams, urlParamName, initialized]);

    // Mise à jour de l'URL lorsque le site sélectionné change
    useEffect(() => {
        if (!persistInUrl || !initialized || !searchParams) return;

        const current = new URLSearchParams(Array.from(searchParams.entries()));

        if (selectedSiteId) {
            current.set(urlParamName, selectedSiteId);
        } else {
            current.delete(urlParamName);
        }

        const search = current.toString();
        const query = search ? `?${search}` : '';

        router.replace(`${pathname}${query}`);
    }, [selectedSiteId, persistInUrl, router, pathname, searchParams, urlParamName, initialized]);

    // Filtrer les sites inactifs si nécessaire
    const activeSites = sites.filter(site => site.isActive !== false);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSiteId = e.target.value;
        onChange(newSiteId === '' ? null : newSiteId);
    };

    return (
        <div className={`site-selector ${className}`}>
            <label htmlFor="site-selector" className="sr-only">Choisir un site</label>
            <select
                id="site-selector"
                name="site-selector"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedSiteId || ''}
                onChange={handleChange}
                disabled={disabled}
                aria-label="Sélectionner un site"
            >
                {includeAllSites && (
                    <option value="">{allSitesLabel}</option>
                )}
                {activeSites.map((site) => (
                    <option
                        key={site.id}
                        value={site.id}
                        style={site.colorCode ? { backgroundColor: site.colorCode } : undefined}
                    >
                        {site.name}
                    </option>
                ))}
            </select>
        </div>
    );
} 