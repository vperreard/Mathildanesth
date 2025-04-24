export type UserRole = 'MAR' | 'IADE' | 'SURGEON';

export type DisplayMode = 'normal' | 'condensed';

export type PersonnelFormat = 'nom' | 'nomPrenom' | 'prenom-nom' | 'nom-specialite' | 'initiale-nom' | 'full' | 'lastName' | 'firstName' | 'initials' | 'firstInitial-lastName';

export type TextStyle = 'normal' | 'bold' | 'italic' | 'boldItalic';

export type TextCase = 'default' | 'uppercase' | 'lowercase' | 'capitalize';

export type FontSize = 'xs' | 'sm' | 'base';

export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double';

export type BorderWidth = 'thin' | 'medium' | 'thick';

export type CardStyle = 'flat' | 'shadowed' | 'bordered' | 'rounded';

export type PersonnelDisplayConfig = {
    chirurgien: {
        format: PersonnelFormat;
        style: TextStyle;
        casse: TextCase;
        fontSize: FontSize;
        colorCode: string;

    };
    mar: {
        format: PersonnelFormat;
        style: TextStyle;
        casse: TextCase;
        fontSize: FontSize;
        colorCode: string;
    };
    iade: {
        format: PersonnelFormat;
        style: TextStyle;
        casse: TextCase;
        fontSize: FontSize;
        colorCode: string;
    };
};

export type VacationColorConfig = {
    matin: string;
    apresmidi: string;
    full: string;
    conflit: string;
    recent: string;
    vide: string;
    border: string;
};

export type DisplayConfig = {
    personnel: PersonnelDisplayConfig;
    vacation: VacationColorConfig;
    backgroundOpacity: number;
    borderStyle: BorderStyle;
    borderWidth: BorderWidth;
    cardStyle: CardStyle;
    showRole: boolean;
};

// Types compatibles avec la page principale
export type User = {
    id: string | number;
    nom: string;
    prenom: string;
    role: UserRole;
    specialty?: string;
    // Pour la compatibilité avec la page principale
    firstName?: string;
    lastName?: string;
};

export type Surgeon = {
    id: string | number;
    nom: string;
    prenom: string;
    specialite: string;
    // Pour la compatibilité avec la page principale
    firstName?: string;
    lastName?: string;
    specialty?: string;
};

export type Room = {
    id: string | number;
    name: string;
    number?: string;
    sector: string;
    colorCode?: string;
    order?: number;
};

export type Shift = 'matin' | 'apresmidi' | 'morning' | 'afternoon' | 'full' | 'MORNING' | 'AFTERNOON' | 'FULL_DAY';

export type Assignment = {
    id: string | number;
    roomId: string | number;
    userId?: string | number | null;
    surgeonId: string | number | null;
    date: Date | string;
    shift: Shift;
    notes?: string;
    isNew?: boolean;
    isModified?: boolean;
    hasConflict?: boolean;
    // Pour la compatibilité avec la page principale
    marId?: string | number | null;
    iadeId?: string | number | null;
    period?: 'MORNING' | 'AFTERNOON' | 'FULL_DAY';
};

export type AssignmentConflict = {
    userId: string | number;
    surgeonId: string | number;
    date: Date | string;
    shift: Shift;
    rooms: (string | number)[];
};

export type RoomOrderConfig = {
    orderedRoomIds: (string | number)[];
}; 