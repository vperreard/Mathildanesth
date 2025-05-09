import { DisplayConfig } from './types';

// Configuration par défaut pour l'affichage
export const defaultDisplayConfig: DisplayConfig = {
    personnel: {
        chirurgien: {
            format: 'nom',
            style: 'bold',
            casse: 'uppercase',
            fontSize: 'sm',
            colorCode: '#4F46E5', // indigo-600
            showRolePrefix: true
        },
        mar: {
            format: 'initiale-nom',
            style: 'normal',
            casse: 'default',
            fontSize: 'xs',
            colorCode: '#2563EB', // blue-600
            showRolePrefix: true
        },
        iade: {
            format: 'nomPrenom',
            style: 'italic',
            casse: 'default',
            fontSize: 'xs',
            colorCode: '#059669', // emerald-600
            showRolePrefix: true
        }
    },
    vacation: {
        matin: '#EFF6FF', // blue-50
        apresmidi: '#FEF3C7', // amber-100
        full: '#E0E7FF', // indigo-100
        conflit: '#FEE2E2', // red-100
        recent: '#ECFDF5', // green-50
        vide: '#F3F4F6', // gray-100
        border: '#E5E7EB' // gray-200
    },
    backgroundOpacity: 0.8,
    borderStyle: 'solid',
    borderWidth: 'medium',
    cardStyle: 'shadowed',
}; 