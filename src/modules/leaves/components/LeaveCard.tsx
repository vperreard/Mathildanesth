import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Edit,
    Trash,
    User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LeaveWithUser, LeaveStatus } from '../types/leave';

interface LeaveCardProps {
    leave: LeaveWithUser;
    onEdit?: (leave: LeaveWithUser) => void;
    onCancel?: (leave: LeaveWithUser) => void;
    onView?: (leave: LeaveWithUser) => void;
    showActions?: boolean;
    isExpanded?: boolean;
    index?: number;
}

export const LeaveCard: React.FC<LeaveCardProps> = ({
    leave,
    onEdit,
    onCancel,
    onView,
    showActions = true,
    isExpanded = false,
    index = 0
}) => {
    // Formater les dates
    const formatDate = (dateString: string | Date) => {
        if (!dateString) return '-';
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return format(date, 'dd MMMM yyyy', { locale: fr });
    };

    // Récupérer la couleur et l'icône en fonction du statut
    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'PENDING': return 'border-yellow-500';
            case 'APPROVED': return 'border-green-500';
            case 'REJECTED': return 'border-red-500';
            case 'CANCELLED': return 'border-gray-400';
            default: return 'border-gray-300';
        }
    };

    const getStatusBadgeColor = (status: string): string => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'PENDING': return 'En attente';
            case 'APPROVED': return 'Approuvé';
            case 'REJECTED': return 'Refusé';
            case 'CANCELLED': return 'Annulé';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-3 h-3 mr-1" />;
            case 'APPROVED': return <CheckCircle className="w-3 h-3 mr-1" />;
            case 'REJECTED': return <XCircle className="w-3 h-3 mr-1" />;
            case 'CANCELLED': return <AlertTriangle className="w-3 h-3 mr-1" />;
            default: return null;
        }
    };

    // Déterminer si les actions d'édition/annulation sont disponibles
    const canEdit = leave.status === LeaveStatus.PENDING && onEdit;
    const canCancel = leave.status === LeaveStatus.PENDING && onCancel;

    return (
        <motion.div
            key={leave.id}
            className={`border-l-4 ${getStatusColor(leave.status)} bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            onClick={() => onView && onView(leave)}
        >
            <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(leave.status)}`}>
                                {getStatusIcon(leave.status)}
                                {getStatusText(leave.status)}
                            </span>
                            <span className="ml-2 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                {leave.type}
                            </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mb-1">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                            <span>Du {formatDate(leave.startDate)} au {formatDate(leave.endDate)}</span>
                        </div>

                        {leave.user && (
                            <div className="flex items-center text-sm text-gray-600">
                                <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                                <span>{leave.user.prenom} {leave.user.nom}</span>
                            </div>
                        )}

                        {isExpanded && leave.reason && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Motif</h4>
                                <p className="text-sm text-gray-600">{leave.reason}</p>
                            </div>
                        )}

                        {isExpanded && leave.comment && (
                            <div className="mt-3">
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Commentaire</h4>
                                <p className="text-sm text-gray-600">{leave.comment}</p>
                            </div>
                        )}
                    </div>

                    {showActions && (
                        <div className="flex mt-4 md:mt-0 space-x-2">
                            {canEdit && (
                                <button
                                    type="button"
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(leave);
                                    }}
                                >
                                    <Edit className="h-3.5 w-3.5 mr-1" />
                                    Modifier
                                </button>
                            )}

                            {canCancel && (
                                <button
                                    type="button"
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCancel(leave);
                                    }}
                                >
                                    <Trash className="h-3.5 w-3.5 mr-1" />
                                    Annuler
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}; 