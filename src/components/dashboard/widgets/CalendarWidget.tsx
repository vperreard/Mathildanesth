import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarWidgetData } from '@/types/dashboard';

interface CalendarWidgetProps {
    title: string;
    data: CalendarWidgetData;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ title, data }) => {
    const { events, view = 'dayGridMonth' } = data;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
            <div className="h-[400px]">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={view}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events.map(event => ({
                        ...event,
                        start: new Date(event.start),
                        end: new Date(event.end)
                    }))}
                    eventContent={(eventInfo) => (
                        <div className="p-1">
                            <div className="font-medium">{eventInfo.event.title}</div>
                            {eventInfo.event.extendedProps.description && (
                                <div className="text-sm text-gray-500">
                                    {eventInfo.event.extendedProps.description}
                                </div>
                            )}
                        </div>
                    )}
                    height="100%"
                />
            </div>
        </div>
    );
}; 