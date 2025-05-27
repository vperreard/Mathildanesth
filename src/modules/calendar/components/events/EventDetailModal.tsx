import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { AnyCalendarEvent, CalendarEventType } from '../../types/event';

interface EventDetailModalProps {
    event: AnyCalendarEvent | null;
    open: boolean;
    onClose: () => void;
}

const getEventTypeDescription = (type: CalendarEventType): string => {
    switch (type) {
        case CalendarEventType.ASSIGNMENT:
            return 'Affectation';
        case CalendarEventType.LEAVE:
            return 'Congé';
        case CalendarEventType.DUTY:
            return 'Garde';
        case CalendarEventType.ON_CALL:
            return 'Astreinte';
        case CalendarEventType.TRAINING:
            return 'Formation';
        case CalendarEventType.MEETING:
            return 'Réunion';
        case CalendarEventType.OTHER:
            return 'Autre';
        default:
            return 'Évènement';
    }
};

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, open, onClose }) => {
    if (!event) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'PPP', { locale: fr });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'HH:mm', { locale: fr });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {event.title}
                <Typography variant="subtitle1" color="text.secondary">
                    {getEventTypeDescription(event.type)}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Typography variant="body1" fontWeight="bold">
                            Date
                        </Typography>
                        <Typography variant="body2">
                            {event.allDay
                                ? `${formatDate(event.start)} - ${formatDate(event.end)}`
                                : `${formatDate(event.start)} de ${formatTime(event.start)} à ${formatTime(event.end)}`}
                        </Typography>
                    </Grid>

                    {event.type === CalendarEventType.ASSIGNMENT && (
                        <>
                            {event.locationName && (
                                <Grid item xs={12}>
                                    <Typography variant="body1" fontWeight="bold">
                                        Lieu
                                    </Typography>
                                    <Typography variant="body2">{event.locationName}</Typography>
                                </Grid>
                            )}
                            {event.teamName && (
                                <Grid item xs={12}>
                                    <Typography variant="body1" fontWeight="bold">
                                        Équipe
                                    </Typography>
                                    <Typography variant="body2">{event.teamName}</Typography>
                                </Grid>
                            )}
                            {event.specialtyName && (
                                <Grid item xs={12}>
                                    <Typography variant="body1" fontWeight="bold">
                                        Spécialité
                                    </Typography>
                                    <Typography variant="body2">{event.specialtyName}</Typography>
                                </Grid>
                            )}
                        </>
                    )}

                    {event.type === CalendarEventType.LEAVE && (
                        <Grid item xs={12}>
                            <Typography variant="body1" fontWeight="bold">
                                Type de congé
                            </Typography>
                            <Typography variant="body2">{event.leaveType || 'Non spécifié'}</Typography>
                        </Grid>
                    )}

                    {event.type === CalendarEventType.DUTY && event.locationName && (
                        <Grid item xs={12}>
                            <Typography variant="body1" fontWeight="bold">
                                Lieu de garde
                            </Typography>
                            <Typography variant="body2">{event.locationName}</Typography>
                        </Grid>
                    )}

                    {event.type === CalendarEventType.ON_CALL && event.locationName && (
                        <Grid item xs={12}>
                            <Typography variant="body1" fontWeight="bold">
                                Lieu d&#39;astreinte
                            </Typography>
                            <Typography variant="body2">{event.locationName}</Typography>
                        </Grid>
                    )}

                    {event.type === CalendarEventType.TRAINING && (
                        <Grid item xs={12}>
                            <Typography variant="body1" fontWeight="bold">
                                Formation
                            </Typography>
                            <Typography variant="body2">{event.trainingName || 'Non spécifié'}</Typography>
                        </Grid>
                    )}

                    {event.type === CalendarEventType.MEETING && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="body1" fontWeight="bold">
                                    Salle
                                </Typography>
                                <Typography variant="body2">{event.meetingRoom || 'Non spécifié'}</Typography>
                            </Grid>
                            {event.attendees && event.attendees.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="body1" fontWeight="bold">
                                        Participants
                                    </Typography>
                                    <Typography variant="body2">
                                        {event.attendees.join(', ')}
                                    </Typography>
                                </Grid>
                            )}
                        </>
                    )}

                    {event.description && (
                        <Grid item xs={12}>
                            <Typography variant="body1" fontWeight="bold">
                                Description
                            </Typography>
                            <Typography variant="body2">{event.description}</Typography>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                {event.type === CalendarEventType.LEAVE && (
                    <Button color="error" variant="outlined">
                        Annuler la demande
                    </Button>
                )}
                {event.type === CalendarEventType.ASSIGNMENT && (
                    <Button color="primary" variant="outlined">
                        Demander un changement
                    </Button>
                )}
                <Button onClick={onClose} color="primary">
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventDetailModal;