// Mock centralisé pour Socket.IO Client - RÉPARÉ ET COMPLET
const createMockSocket = () => {
  const eventListeners = new Map();
  
  const mockSocket = {
    // État de connexion
    connected: false,
    disconnected: true,
    id: 'test-socket-id',
    
    // Méthodes de gestion d'événements
    on: jest.fn((event, callback) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event).push(callback);
      return mockSocket;
    }),
    
    off: jest.fn((event, callback) => {
      if (eventListeners.has(event)) {
        const callbacks = eventListeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
      return mockSocket;
    }),
    
    once: jest.fn((event, callback) => {
      const wrappedCallback = (...args) => {
        callback(...args);
        mockSocket.off(event, wrappedCallback);
      };
      mockSocket.on(event, wrappedCallback);
      return mockSocket;
    }),
    
    // Méthodes de communication
    emit: jest.fn((event, ...args) => {
      // Simuler la réception pour certains événements de test
      if (event === 'test-echo') {
        setTimeout(() => {
          mockSocket._simulateEvent('test-echo-response', ...args);
        }, 0);
      }
      return mockSocket;
    }),
    
    // Méthodes de connexion
    connect: jest.fn(() => {
      mockSocket.connected = true;
      mockSocket.disconnected = false;
      setTimeout(() => {
        mockSocket._simulateEvent('connect');
      }, 0);
      return mockSocket;
    }),
    
    disconnect: jest.fn(() => {
      mockSocket.connected = false;
      mockSocket.disconnected = true;
      setTimeout(() => {
        mockSocket._simulateEvent('disconnect');
      }, 0);
      return mockSocket;
    }),
    
    // Configuration
    auth: {},
    
    // Méthodes internes pour les tests
    _simulateEvent: (event, ...args) => {
      if (eventListeners.has(event)) {
        eventListeners.get(event).forEach(callback => {
          try {
            callback(...args);
          } catch (error) {
            console.warn(`Error in socket event listener for ${event}:`, error);
          }
        });
      }
    },
    
    _simulateConnect: () => {
      mockSocket.connected = true;
      mockSocket.disconnected = false;
      mockSocket._simulateEvent('connect');
    },
    
    _simulateDisconnect: () => {
      mockSocket.connected = false;
      mockSocket.disconnected = true;
      mockSocket._simulateEvent('disconnect');
    },
    
    _simulateError: (error) => {
      mockSocket._simulateEvent('error', error);
    },
    
    _clearListeners: () => {
      eventListeners.clear();
    }
  };
  
  return mockSocket;
};

// Export du mock
const mockIo = jest.fn(() => createMockSocket());

module.exports = {
  __esModule: true,
  default: mockIo,
  io: mockIo,
  Socket: jest.fn(() => createMockSocket()),
  Manager: jest.fn(() => ({
    open: jest.fn(),
    close: jest.fn(),
    socket: jest.fn(() => createMockSocket())
  })),
  // Utilitaire pour créer un socket pour les tests
  createMockSocket,
};