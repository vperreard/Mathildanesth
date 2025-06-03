// Test simplifié pour useContextualMessagesWebSocket - STABILISÉ
import { renderHook } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import { useContextualMessagesWebSocket } from '../useContextualMessagesWebSocket';

// Mock minimal pour test de base
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 1, email: 'test@example.com' } },
    status: 'authenticated'
  })
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  }))
}));

jest.mock('@/lib/auth-helpers', () => ({
  getAuthToken: jest.fn(() => 'mock-token'),
  createAuthHeaders: jest.fn(() => ({
    'Authorization': 'Bearer mock-token',
    'Content-Type': 'application/json'
  }))
}));

// Mock fetch global simple
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ messages: [] })
}) as jest.Mock;

describe('useContextualMessagesWebSocket - Tests simplifiés', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllMocks();
  });

  it('should initialize without errors', () => {
    const { result } = renderHook(() => 
      useContextualMessagesWebSocket({ assignmentId: 'test-123' })
    );
    
    expect(result.current).toBeDefined();
    expect(result.current.messages).toEqual([]);
    expect(result.current.isConnected).toBeDefined();
  });

  it('should have sendMessage function', () => {
    const { result } = renderHook(() => 
      useContextualMessagesWebSocket({ assignmentId: 'test-123' })
    );
    
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('should handle assignment ID change', () => {
    const { result, rerender } = renderHook(
      ({ assignmentId }) => useContextualMessagesWebSocket({ assignmentId }),
      { initialProps: { assignmentId: 'test-123' } }
    );
    
    // Changer l'assignmentId
    rerender({ assignmentId: 'test-456' });
    
    expect(result.current).toBeDefined();
  });
});