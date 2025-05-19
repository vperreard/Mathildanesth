import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";

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
            // S'assurer que le premier site est actif si possible
            const firstActiveSite = sites.find(s => s.isActive !== false) || sites[0];
            if (firstActiveSite) {
                onChange(firstActiveSite.id);
            }
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

        // Utiliser router.replace pour éviter d'ajouter à l'historique de navigation
        // seulement si le pathname et le query sont différents pour éviter boucle
        if (`${pathname}${query}` !== `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`) {
            router.replace(`${pathname}${query}`);
        }

    }, [selectedSiteId, persistInUrl, router, pathname, searchParams, urlParamName, initialized]);

    const activeSites = sites.filter(site => site.isActive !== false);

    const handleValueChange = (newSiteId: string) => {
        onChange(newSiteId === 'all-sites-option' ? null : newSiteId);
    };

    const displayValue = selectedSiteId ? activeSites.find(s => s.id === selectedSiteId)?.name : allSitesLabel;

    return (
        <div className={`site-selector ${className}`}>
            <Select
                value={selectedSiteId || (includeAllSites ? 'all-sites-option' : '')}
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <SelectTrigger className="w-auto min-w-[180px] max-w-[300px]"> {/* Ajuster largeur au besoin */}
                    <SelectValue placeholder={allSitesLabel || "Sélectionner un site"}>
                        {displayValue}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                    <SelectGroup>
                        {includeAllSites && (
                            <SelectItem value="all-sites-option">{allSitesLabel}</SelectItem>
                        )}
                        {activeSites.map((site) => (
                            <SelectItem
                                key={site.id}
                                value={site.id}
                            // Le style direct sur SelectItem n'est pas standard,
                            // on pourrait utiliser des classes ou wrapper le contenu pour la couleur.
                            // Pour l'instant, on omet le colorCode direct pour la simplicité de la migration.
                            // Si besoin, on pourra ajouter un span avec une puce colorée ou autre.
                            >
                                {site.name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
} 