import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnyCalendarEvent, CalendarEventType } from '../types/event';

export interface LeaveDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    leave: unknown; // Nous utilisons any temporairement, à remplacer par LeaveEvent quand défini
    showApprovalButtons?: boolean;
    onApprove?: (leaveId: string) => void;
    onReject?: (leaveId: string) => void;
}

export const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
    isOpen,
    onClose,
    leave,
    showApprovalButtons = false,
    onApprove,
    onReject
}) => {
    if (!isOpen || !leave) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">{leave.title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Utilisateur:</span>
                            <span className="ml-2">{leave.user?.firstName} {leave.user?.lastName}</span>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-500">Type:</span>
                            <span className="ml-2">
                                {leave.type === CalendarEventType.LEAVE && (
                                    <span>{leave.leaveType || 'Congé'}</span>
                                )}
                            </span>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-500">Date:</span>
                            <span className="ml-2">
                                Du {format(new Date(leave.start), 'dd/MM/yyyy')} au {format(new Date(leave.end), 'dd/MM/yyyy')}
                            </span>
                        </div>

                        {leave.type === CalendarEventType.LEAVE && leave.status && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Statut:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs 
                  ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' : ''}
                  ${leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
                `}>
                                    {leave.status === 'APPROVED' && 'Approuvé'}
                                    {leave.status === 'PENDING' && 'En attente'}
                                    {leave.status === 'REJECTED' && 'Refusé'}
                                </span>
                            </div>
                        )}

                        {leave.type === CalendarEventType.LEAVE && leave.countedDays !== undefined && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Jours comptabilisés:</span>
                                <span className="ml-2">{leave.countedDays}</span>
                            </div>
                        )}

                        {leave.description && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Description:</span>
                                <p className="mt-1 text-sm text-gray-600">{leave.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                    {showApprovalButtons && (
                        <>
                            <button
                                onClick={() => onApprove && onApprove(leave.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Approuver
                            </button>
                            <button
                                onClick={() => onReject && onReject(leave.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Refuser
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}; 