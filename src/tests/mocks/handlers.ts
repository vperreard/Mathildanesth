import { rest } from 'msw';

// Définir les handlers pour les APIs mockées
export const handlers = [
    // Mock de l'API des congés
    rest.get('/api/leaves', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                {
                    id: '1',
                    userId: '1',
                    startDate: '2025-05-01',
                    endDate: '2025-05-05',
                    type: 'CONGE_PAYE',
                    status: 'APPROVED',
                    reason: 'Vacances'
                },
                {
                    id: '2',
                    userId: '2',
                    startDate: '2025-05-10',
                    endDate: '2025-05-15',
                    type: 'CONGE_PAYE',
                    status: 'PENDING',
                    reason: 'Vacances'
                }
            ])
        );
    }),

    // Mock de l'API de création de congés
    rest.post('/api/leaves', (req, res, ctx) => {
        return res(
            ctx.status(201),
            ctx.json({
                id: '123',
                status: 'PENDING',
                createdAt: new Date().toISOString()
            })
        );
    }),

    // Mock de l'API des conflits de congés
    rest.get('/api/leaves/conflicts', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([])
        );
    }),

    // Mock de l'API des événements du calendrier
    rest.get('/api/calendar/events', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                {
                    id: '1',
                    title: 'Congé Jean Dupont',
                    start: '2025-05-01',
                    end: '2025-05-05',
                    type: 'LEAVE',
                    userId: '1'
                },
                {
                    id: '2',
                    title: 'Formation équipe',
                    start: '2025-05-10',
                    end: '2025-05-10',
                    type: 'TRAINING',
                    userId: null
                }
            ])
        );
    }),

    // Mock de l'API des notifications
    rest.get('/api/notifications', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                {
                    id: '1',
                    title: 'Nouvelle demande de congé',
                    message: 'Votre demande a été soumise',
                    type: 'INFO',
                    read: false,
                    createdAt: new Date().toISOString()
                }
            ])
        );
    }),

    // Mock de l'API d'authentification
    rest.get('/api/auth/session', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                user: { id: '1', name: 'Jean Dupont', role: 'ADMIN_TOTAL' }
            })
        );
    }),

    // Mock de l'API des préférences utilisateur
    rest.get('/api/user/preferences', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                // Configuration par défaut à retourner
                personnel: {
                    chirurgien: {
                        format: 'nom',
                        style: 'bold',
                        casse: 'uppercase',
                        fontSize: 'sm',
                        colorCode: '#4F46E5'
                    },
                    mar: {
                        format: 'initiale-nom',
                        style: 'normal',
                        casse: 'default',
                        fontSize: 'xs',
                        colorCode: '#2563EB'
                    },
                    iade: {
                        format: 'nomPrenom',
                        style: 'italic',
                        casse: 'default',
                        fontSize: 'xs',
                        colorCode: '#059669'
                    }
                },
                vacation: {
                    matin: '#EFF6FF',
                    apresmidi: '#FEF3C7',
                    full: '#E0E7FF',
                    conflit: '#FEE2E2',
                    recent: '#ECFDF5',
                    vide: '#F3F4F6',
                    border: '#E5E7EB'
                },
                backgroundOpacity: 0.8,
                borderStyle: 'solid',
                borderWidth: 'medium',
                cardStyle: 'shadowed',
                showRole: true
            })
        );
    })
]; 