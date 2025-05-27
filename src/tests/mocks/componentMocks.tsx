import React, { FC, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Mock pour FullCalendar
export const MockFullCalendar = ({ events, initialView, eventClick, dateClick }: any) => (
    <div data-testid="fullcalendar" data-view={initialView}>
        <div data-testid="event-container">
            {events?.map((event: any, index: number) => (
                <div
                    key={index}
                    data-testid={`event-${event.id}`}
                    onClick={() => eventClick?.({
                        event: {
                            extendedProps: event,
                            id: event.id,
                            start: event.start,
                            end: event.end
                        }
                    })}
                >
                    {event.title}
                </div>
            ))}
        </div>
        <button
            data-testid="prev-button"
            onClick={() => dateClick?.({ date: new Date('2023-05-01') })}
        >
            Semaine précédente
        </button>
        <button
            data-testid="next-button"
            onClick={() => dateClick?.({ date: new Date('2023-05-15') })}
        >
            Semaine suivante
        </button>
    </div>
);

// Mock pour LeaveDetailModal
export const MockLeaveDetailModal = ({ leaveId, onClose }: any) => (
    <div data-testid="leave-detail-modal">
        <span>Leave ID: {leaveId}</span>
        <button onClick={onClose}>Fermer</button>
    </div>
);

// Mock pour BaseCalendar
export const MockBaseCalendar = (props: any) => (
    <div data-testid="base-calendar">
        {props.events?.map((event: any) => (
            <div key={event.id} data-testid={`calendar-event-${event.id}`}>
                {event.title}
            </div>
        ))}
    </div>
);

// Mock pour BlocPlanning
export const MockBlocPlanning = () => (
    <div data-testid="bloc-planning">
        <h2>Planning du bloc opératoire</h2>
        <div className="mock-calendar-grid">
            <div>Lundi</div>
            <div>Mardi</div>
            <div>Mercredi</div>
            <div>Jeudi</div>
            <div>Vendredi</div>
        </div>
    </div>
);

// Mock pour BlocPlanningDay
export const MockBlocPlanningDay = ({ planning }: any) => (
    <div data-testid="bloc-planning-day">
        <h3>Planification journalière</h3>
        <div>Planning: {planning ? 'Disponible' : 'Non disponible'}</div>
        <div>Statut: {planning?.validationStatus || 'N/A'}</div>
        {planning?.salles && (
            <div>
                <h4>Salles ({planning.salles.length})</h4>
                <ul>
                    {planning.salles.map((salle: any) => (
                        <li key={salle.id}>
                            Salle ID: {salle.salleId},
                            Superviseurs: {salle.superviseurs.length}
                        </li>
                    ))}
                </ul>
            </div>
        )}
        {planning?.notes && <div>Notes: {planning.notes}</div>}
    </div>
);

// Mock pour AssignmentConfigPanel
export const MockAssignmentConfigPanel = () => (
    <div data-testid="mock-assignment-config">
        Configuration mockée
    </div>
);

// Mock pour VariationConfigPanel
export const MockVariationConfigPanel = () => (
    <div data-testid="mock-variation-config">
        Variation mockée
    </div>
);

// Mock pour motion de framer-motion
export const createFramerMotionMock = () => {
    return {
        motion: {
            div: (props: any) => {
                const { children, ...rest } = props;
                return <div {...rest}>{children}</div>;
            },
            button: (props: any) => {
                const { children, ...rest } = props;
                return <button {...rest}>{children}</button>;
            },
            span: (props: any) => {
                const { children, ...rest } = props;
                return <span {...rest}>{children}</span>;
            }
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
};

// Mock pour le calendrier
export const MockCalendar = ({ events, onEventClick, view }: any) => (
    <div data-testid="calendar">
        <div>Vue: {view}</div>
        <div className="events-list">
            {events?.map((event: any) => (
                <div
                    key={event.id}
                    className="event"
                    onClick={() => onEventClick(event)}
                >
                    {event.title} ({new Date(event.start).toLocaleDateString()})
                </div>
            ))}
        </div>
    </div>
);

// Mock pour la modal de détails de congés
export const MockLeaveDetailsModal = ({ leave, onClose }: any) => (
    <div data-testid="leave-details-modal">
        <h2>Détails du congé</h2>
        <div>ID: {leave?.id}</div>
        <div>Début: {leave?.startDate}</div>
        <div>Fin: {leave?.endDate}</div>
        <div>Type: {leave?.type}</div>
        <div>Statut: {leave?.status}</div>
        <button onClick={onClose}>Fermer</button>
    </div>
);

// Mock pour les formulaires de demande de congés
export const MockLeaveRequestForm = ({ onSubmit }: any) => (
    <form
        data-testid="leave-request-form"
        onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
                startDate: '2023-06-01',
                endDate: '2023-06-05',
                type: 'REGULAR',
                notes: 'Test'
            });
        }}
    >
        <button type="submit">Soumettre</button>
    </form>
);

// Mock pour la gestion des quotas
export const MockQuotaManagement = ({ quotas }: any) => (
    <div data-testid="quota-management">
        <h2>Gestion des quotas</h2>
        <ul>
            {quotas?.map((quota: any) => (
                <li key={quota.id}>
                    Type: {quota.type}, Disponible: {quota.amount - quota.used} / {quota.amount}
                </li>
            ))}
        </ul>
    </div>
);

// Mock pour le tableau des congés
export const MockLeaveTable = ({ leaves, onApprove, onReject }: any) => (
    <table data-testid="leave-table">
        <thead>
            <tr>
                <th>Utilisateur</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {leaves?.map((leave: any) => (
                <tr key={leave.id}>
                    <td>{leave.userName}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.type}</td>
                    <td>{leave.status}</td>
                    <td>
                        {leave.status === 'PENDING' && (
                            <>
                                <button onClick={() => onApprove(leave.id)}>Approuver</button>
                                <button onClick={() => onReject(leave.id)}>Rejeter</button>
                            </>
                        )}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

// Mock des composants de layout souvent présents dans les tests
export const MockLayoutWrapper: FC<{ children: ReactNode }> = ({ children }) => {
    return <div data-testid="layout-wrapper">{children}</div>;
};

// Mock du hook useRouter
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

// Configuration de base des mocks
(useRouter as jest.Mock).mockImplementation(() => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
        on: jest.fn(),
        off: jest.fn(),
    },
}));

/**
 * Mocks liés aux conflits de congés.
 */
jest.mock('@/modules/conges/hooks/useLeaveConflictNotification', () => ({
    useLeaveConflictNotification: jest.fn().mockReturnValue({
        notifyConflict: jest.fn(),
        notifyConflicts: jest.fn(),
        notifyCurrentConflicts: jest.fn(),
        showBlockingAlert: jest.fn().mockReturnValue(null),
        showWarningAlert: jest.fn().mockReturnValue(null),
        showInfoAlert: jest.fn().mockReturnValue(null),
        formatConflictMessage: jest.fn(),
        formatConflictTitle: jest.fn(),
        notificationsSent: false,
        resetNotifications: jest.fn(),
        conflictDetection: {
            conflicts: [],
            getBlockingConflicts: jest.fn().mockReturnValue([]),
            getWarningConflicts: jest.fn().mockReturnValue([]),
            getInfoConflicts: jest.fn().mockReturnValue([]),
            detectConflicts: jest.fn(),
            detectConflictsBetweenLeaves: jest.fn(),
        }
    })
}));

// Mock pour UserProvider, souvent nécessaire pour les hooks utilisant useUser
// ... autres mocks ...

export default {
    MockLayoutWrapper,
}; 