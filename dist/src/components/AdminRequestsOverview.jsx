'use client';
import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { groupOverlappingRequests } from '@/lib/dateUtils';
export default function AdminRequestsOverview(_a) {
    var activeRequest = _a.activeRequest, allRequests = _a.allRequests;
    var _b = useState({ approved: [], pending: [] }), overlappingRequests = _b[0], setOverlappingRequests = _b[1];
    // Si pas de requête active ou pas de dates, on n'affiche rien
    if (!activeRequest || !activeRequest.dates) {
        return null;
    }
    // Trouver toutes les requêtes qui se chevauchent avec la requête active
    useEffect(function () {
        if (!activeRequest || !activeRequest.dates) {
            setOverlappingRequests({ approved: [], pending: [] });
            return;
        }
        var activeStart = new Date(activeRequest.dates.start);
        var activeEnd = new Date(activeRequest.dates.end);
        // Filtrer pour avoir uniquement les congés (pas les autres types de requêtes)
        var congeRequests = allRequests.filter(function (r) {
            return r.type === 'congés' && r.id !== activeRequest.id && r.dates;
        });
        // Vérifier les chevauchements
        var overlapping = congeRequests.filter(function (request) {
            if (!request.dates)
                return false;
            var requestStart = new Date(request.dates.start);
            var requestEnd = new Date(request.dates.end);
            // Logique de chevauchement: si une des plages est contenue dans l'autre
            return ((requestStart <= activeEnd && requestStart >= activeStart) ||
                (requestEnd >= activeStart && requestEnd <= activeEnd) ||
                (requestStart <= activeStart && requestEnd >= activeEnd));
        });
        // Trier par statut
        var approved = overlapping.filter(function (r) { return r.status === 'approuvée'; });
        var pending = overlapping.filter(function (r) { return r.status === 'en-attente'; });
        setOverlappingRequests({ approved: approved, pending: pending });
    }, [activeRequest, allRequests]);
    // Fonction pour formater les dates de manière compacte
    var formatDateCompact = function (dateStr) {
        var date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    };
    // Grouper les requêtes qui ont les mêmes dates
    var groupedApproved = groupOverlappingRequests(overlappingRequests.approved);
    var groupedPending = groupOverlappingRequests(overlappingRequests.pending);
    return (<div className="px-4 py-3 bg-white border-b border-gray-200 shadow-sm text-sm">
            <div className="flex items-center space-x-2 mb-1.5">
                <Calendar className="w-4 h-4 text-primary-500"/>
                <span className="font-medium text-gray-700">
                    Congés demandés: {formatDateCompact(activeRequest.dates.start)} - {formatDateCompact(activeRequest.dates.end)}
                </span>
            </div>

            <div className="flex flex-wrap gap-y-1 gap-x-3">
                {groupedApproved.length > 0 && (<div className="flex items-start space-x-1">
                        <div className="flex items-center">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5"/>
                            <span className="ml-1 font-medium text-gray-700">Congés validés: </span>
                        </div>
                        <ul className="flex flex-wrap gap-x-3">
                            {groupedApproved.map(function (group, idx) { return (<li key={idx} className="flex items-center bg-green-50 px-2 py-0.5 rounded-md text-green-800">
                                    <span className="font-medium">{group.users.join(', ')}</span>
                                    <span className="ml-1 text-xs">
                                        ({formatDateCompact(group.dates.start)}-{formatDateCompact(group.dates.end)})
                                    </span>
                                </li>); })}
                        </ul>
                    </div>)}

                {groupedPending.length > 0 && (<div className="flex items-start space-x-1">
                        <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5"/>
                            <span className="ml-1 font-medium text-gray-700">En attente: </span>
                        </div>
                        <ul className="flex flex-wrap gap-x-3">
                            {groupedPending.map(function (group, idx) { return (<li key={idx} className="flex items-center bg-amber-50 px-2 py-0.5 rounded-md text-amber-800">
                                    <span className="font-medium">{group.users.join(', ')}</span>
                                    <span className="ml-1 text-xs">
                                        ({formatDateCompact(group.dates.start)}-{formatDateCompact(group.dates.end)})
                                    </span>
                                </li>); })}
                        </ul>
                    </div>)}

                {groupedApproved.length === 0 && groupedPending.length === 0 && (<span className="text-gray-500 italic">Aucun congé approuvé ou en attente sur cette période</span>)}
            </div>
        </div>);
}
