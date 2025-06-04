import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Handlers basiques pour les tests
const handlers = [
  // Auth endpoints
  http.get('*/api/auth/me', () => {
    return HttpResponse.json({
      authenticated: true,
      user: {
        id: 'mock-user-id',
        login: 'testuser',
        nom: 'Test',
        prenom: 'User',
        email: 'test@example.com',
        role: 'ADMIN_TOTAL',
        mustChangePassword: false,
      },
    });
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const body = await request.json();
    
    if (!body || !body.email || !body.password) {
      return HttpResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        authenticated: true,
        user: {
          id: 'mock-user-id',
          login: 'testuser',
          nom: 'Test',
          prenom: 'User',
          email: 'test@example.com',
          role: 'ADMIN_TOTAL',
          mustChangePassword: false,
        },
      });
    }

    return HttpResponse.json(
      { error: 'Identifiants invalides' },
      { status: 401 }
    );
  }),

  // Leaves endpoints
  http.get('*/api/conges/balance', () => {
    return HttpResponse.json({
      userId: 'mock-user-id',
      year: new Date().getFullYear(),
      initialAllowance: 25,
      additionalAllowance: 5,
      used: 10,
      pending: 2,
      remaining: 18,
    });
  }),

  // Contextual messages endpoints
  http.get('*/api/contextual-messages', ({ request }) => {
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('assignmentId');
    
    return HttpResponse.json({
      messages: [
        {
          id: 'msg-1',
          content: 'Message de test pour ' + (assignmentId || 'assignement générique'),
          assignmentId: assignmentId,
          userId: 'mock-user-id',
          createdAt: new Date().toISOString(),
        }
      ],
      total: 1,
    });
  }),

  http.post('*/api/contextual-messages', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      id: 'msg-new',
      content: body.content,
      assignmentId: body.assignmentId,
      userId: 'mock-user-id',
      createdAt: new Date().toISOString(),
    });
  }),

  // Additional common endpoints
  http.get('*/api/operating-rooms', () => {
    return HttpResponse.json({
      rooms: [
        { id: 1, name: 'Salle 1', sector: 'Bloc A', active: true },
        { id: 2, name: 'Salle 2', sector: 'Bloc B', active: true }
      ]
    });
  }),

  http.get('*/api/sites', () => {
    return HttpResponse.json({
      sites: [
        { id: 1, name: 'Site Principal', code: 'SP1' },
        { id: 2, name: 'Site Secondaire', code: 'SS1' }
      ]
    });
  }),

  http.get('*/api/users', () => {
    return HttpResponse.json({
      users: [
        { id: 1, login: 'user1', nom: 'Test', prenom: 'User1', role: 'USER', actif: true },
        { id: 2, login: 'admin', nom: 'Admin', prenom: 'Test', role: 'ADMIN_TOTAL', actif: true }
      ]
    });
  }),

  // Wildcard handlers for missing APIs
  http.get('*/api/*', ({ request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Return empty success response for unknown GET requests
    return HttpResponse.json({ 
      data: [], 
      message: `Mock response for ${pathname}`,
      success: true 
    });
  }),

  http.post('*/api/*', ({ request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Return success response for unknown POST requests
    return HttpResponse.json({ 
      id: 'mock-id',
      message: `Mock response for ${pathname}`,
      success: true 
    });
  }),

  // Final fallback
  http.get('*', ({ request }) => {
    console.warn(`Truly unhandled request: ${request.method} ${request.url}`);
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),
];

export const server = setupServer(...handlers);

// Export http for convenience in tests
export { http }; 