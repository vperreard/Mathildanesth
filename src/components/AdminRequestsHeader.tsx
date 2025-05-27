import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { Request } from '@/lib/requestUtils';
import { formatDateRange, groupOverlappingRequests } from '@/lib/dateUtils';

interface HeaderConfig {
    showOverlappingRequests: boolean;
    showUserDetails: boolean;
    highlightOverlappingCount: number;
    groupRequestsByDate: boolean;
    showWarningWhenOverlapping: boolean;
}

interface AdminRequestsHeaderProps {
    activeRequest: Request | null;
    allRequests: Request[];
    onClose?: () => void;
}

/**
 * Composant header pour l'interface admin présentant un aperçu des congés
 * aux mêmes dates que la requête actuellement consultée
 */
export default function AdminRequestsHeader({
    activeRequest,
    allRequests,
    onClose
}: AdminRequestsHeaderProps) {
    const [config, setConfig] = useState<HeaderConfig>({
        showOverlappingRequests: true,
        showUserDetails: true,
        highlightOverlappingCount: 3,
        groupRequestsByDate: false,
        showWarningWhenOverlapping: true
    });

    // Charger la configuration
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/admin/configuration');
                if (response.ok) {
                    const data = await response.json();
                    if (data.header) {
                        setConfig(data.header);
                    }
                }
            } catch (error) {
                console.error("Erreur lors du chargement de la configuration:", error);
            }
        };

        fetchConfig();
    }, []);

    if (!activeRequest || activeRequest.type !== 'congés' || !activeRequest.dates) {
        return null;
    }

    // Filtrer les requêtes qui se chevauchent avec la requête active
    const overlappingRequests = allRequests.filter(request => {
        // Exclure la requête active et les requêtes qui ne sont pas des congés
        if (request.id === activeRequest.id || request.type !== 'congés' || !request.dates) {
            return false;
        }

        // Vérifier si les dates se chevauchent
        const activeStart = new Date(activeRequest.dates!.start);
        const activeEnd = new Date(activeRequest.dates!.end);
        const requestStart = new Date(request.dates.start);
        const requestEnd = new Date(request.dates.end);

        // Vérifier si les dates se chevauchent et si la requête est approuvée ou en attente
        return (
            (requestStart <= activeEnd && requestEnd >= activeStart) &&
            (request.status === 'approuvée' || request.status === 'en-attente')
        );
    });

    // Dédupliquer les requêtes en utilisant un Set pour les IDs
    const uniqueOverlappingRequests = Array.from(
        new Map(overlappingRequests.map(request => [request.id, request])).values()
    );

    // Séparer les requêtes approuvées et en attente
    const approvedRequests = uniqueOverlappingRequests.filter(r => r.status === 'approuvée');
    const pendingRequests = uniqueOverlappingRequests.filter(r => r.status === 'en-attente');

    const requestDateRange = formatDateRange(activeRequest.dates.start, activeRequest.dates.end, 'short');

    // Si on doit grouper les requêtes par date
    const groupedApproved = config.groupRequestsByDate
        ? groupOverlappingRequests(approvedRequests)
        : null;

    const groupedPending = config.groupRequestsByDate
        ? groupOverlappingRequests(pendingRequests)
        : null;

    const totalOverlappingCount = approvedRequests.length + pendingRequests.length;
    const showWarning = config.showWarningWhenOverlapping &&
        totalOverlappingCount >= config.highlightOverlappingCount;

    return (
        <div className="bg-slate-50 border-b border-slate-200 p-3 text-sm">
            <div className="flex items-center justify-between">
                {config.showUserDetails && (
                    <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-500" />
                        <span className="font-medium">{activeRequest.userName}</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                            {activeRequest.type}
                        </span>
                        <div className="flex items-center ml-2">
                            <Calendar size={14} className="mr-1 text-slate-500" />
                            <span>{requestDateRange}</span>
                        </div>
                    </div>
                )}

                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        ×
                    </button>
                )}
            </div>

            {config.showOverlappingRequests && (approvedRequests.length > 0 || pendingRequests.length > 0) && (
                <div className="mt-2 text-xs flex flex-col gap-1.5">
                    <div className="font-medium text-slate-700">Autres absences aux mêmes dates :</div>

                    {approvedRequests.length > 0 && (
                        <div className="flex items-start gap-1.5">
                            <CheckCircle size={14} className="text-green-500 mt-0.5" />
                            <div>
                                <span className="font-medium text-green-700">Validées :</span>{' '}
                                {config.groupRequestsByDate ? (
                                    <div className="flex flex-wrap gap-y-1 gap-x-2 mt-1">
                                        {groupedApproved!.map((group, idx) => (
                                            <span key={idx} className="bg-green-50 px-2 py-0.5 rounded-md text-green-800">
                                                <span className="font-medium">{group.users.join(', ')}</span>
                                                <span className="ml-1 text-xs">
                                                    ({formatDateRange(group.dates.start, group.dates.end, 'short')})
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    approvedRequests.map((req, index) => (
                                        <span key={req.id} className="whitespace-nowrap">
                                            {req.userName}
                                            {index < approvedRequests.length - 1 ? ', ' : ''}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {pendingRequests.length > 0 && (
                        <div className="flex items-start gap-1.5">
                            <Clock size={14} className="text-amber-500 mt-0.5" />
                            <div>
                                <span className="font-medium text-amber-700">En attente :</span>{' '}
                                {config.groupRequestsByDate ? (
                                    <div className="flex flex-wrap gap-y-1 gap-x-2 mt-1">
                                        {groupedPending!.map((group, idx) => (
                                            <span key={idx} className="bg-amber-50 px-2 py-0.5 rounded-md text-amber-800">
                                                <span className="font-medium">{group.users.join(', ')}</span>
                                                <span className="ml-1 text-xs">
                                                    ({formatDateRange(group.dates.start, group.dates.end, 'short')})
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    pendingRequests.map((req, index) => (
                                        <span key={req.id} className="whitespace-nowrap">
                                            {req.userName}
                                            {index < pendingRequests.length - 1 ? ', ' : ''}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {showWarning && (
                        <div className="flex items-start gap-1.5 text-orange-700">
                            <AlertCircle size={14} className="text-orange-500 mt-0.5" />
                            <div>
                                <span className="font-medium">Attention :</span> {approvedRequests.length + pendingRequests.length} personnes
                                absentes sur cette période
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 