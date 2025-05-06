import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
    title: 'Planning Hebdomadaire | Mathildanesth',
    description: 'Planning hebdomadaire des salles d\'opération',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#000000' },
    ],
};

export default function WeeklyPlanningLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            {children}
        </div>
    );
} 