// Common test setup and global mocks - Complet et optimisé
import React from 'react';
import { defaultJestSetup } from './standardMocks';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Canvas for chart components
export const setupCanvasMock = () => {
  if (typeof window !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Array(4),
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    })) as any;
  }
};

// Mock Recharts components
export const mockRecharts = () => {
  jest.mock('recharts', () => {
    const React = require('react');
    return {
      ResponsiveContainer: ({ children }: unknown) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
      BarChart: ({ children }: unknown) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
      Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
      XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
      YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
      Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
      Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
      Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
      CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
      PieChart: ({ children }: unknown) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
      Pie: () => React.createElement('div', { 'data-testid': 'pie' }),
      LineChart: ({ children }: unknown) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
      Line: () => React.createElement('div', { 'data-testid': 'line' }),
      Area: () => React.createElement('div', { 'data-testid': 'area' }),
      AreaChart: ({ children }: unknown) => React.createElement('div', { 'data-testid': 'area-chart' }, children),
      RadialBarChart: ({ children }: unknown) => React.createElement('div', { 'data-testid': 'radial-bar-chart' }, children),
      RadialBar: () => React.createElement('div', { 'data-testid': 'radial-bar' }),
      PolarGrid: () => React.createElement('div', { 'data-testid': 'polar-grid' }),
      PolarAngleAxis: () => React.createElement('div', { 'data-testid': 'polar-angle-axis' }),
      PolarRadiusAxis: () => React.createElement('div', { 'data-testid': 'polar-radius-axis' }),
      Sankey: () => React.createElement('div', { 'data-testid': 'sankey' }),
    };
  });
};

// Mock D3 for complex charts
export const mockD3 = () => {
  const d3Mock = {
    select: jest.fn(() => d3Mock),
    selectAll: jest.fn(() => d3Mock),
    append: jest.fn(() => d3Mock),
    attr: jest.fn(() => d3Mock),
    style: jest.fn(() => d3Mock),
    text: jest.fn(() => d3Mock),
    on: jest.fn(() => d3Mock),
    transition: jest.fn(() => d3Mock),
    duration: jest.fn(() => d3Mock),
    ease: jest.fn(() => d3Mock),
    data: jest.fn(() => d3Mock),
    enter: jest.fn(() => d3Mock),
    exit: jest.fn(() => d3Mock),
    remove: jest.fn(() => d3Mock),
    merge: jest.fn(() => d3Mock),
    call: jest.fn(() => d3Mock),
    scaleLinear: jest.fn(() => {
      const scale: any = (value: number) => value;
      scale.domain = jest.fn(() => scale);
      scale.range = jest.fn(() => scale);
      scale.ticks = jest.fn(() => []);
      return scale;
    }),
    scaleBand: jest.fn(() => {
      const scale: any = (value: string) => 0;
      scale.domain = jest.fn(() => scale);
      scale.range = jest.fn(() => scale);
      scale.padding = jest.fn(() => scale);
      scale.bandwidth = jest.fn(() => 10);
      return scale;
    }),
    scaleOrdinal: jest.fn(() => {
      const scale: any = (value: string) => '#000000';
      scale.domain = jest.fn(() => scale);
      scale.range = jest.fn(() => scale);
      return scale;
    }),
    axisBottom: jest.fn(() => d3Mock),
    axisLeft: jest.fn(() => d3Mock),
    max: jest.fn(() => 100),
    min: jest.fn(() => 0),
    interpolateViridis: jest.fn(() => '#000000'),
    schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
  };

  jest.mock('d3', () => d3Mock);
  jest.mock('d3-selection', () => d3Mock);
  jest.mock('d3-scale', () => d3Mock);
  jest.mock('d3-axis', () => d3Mock);
  jest.mock('d3-array', () => d3Mock);
  jest.mock('d3-scale-chromatic', () => d3Mock);
  
  return d3Mock;
};

// Mock fetch globally
export const setupGlobalFetch = () => {
  if (!global.fetch || typeof global.fetch.mockResolvedValue !== 'function') {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      json: jest.fn().mockResolvedValue({}),
      text: jest.fn().mockResolvedValue(''),
      blob: jest.fn().mockResolvedValue(new Blob()),
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      clone: jest.fn(),
    });
  }
  return global.fetch as jest.MockedFunction<typeof fetch>;
};

// Mock socket.io-client globally
export const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: 'test-socket-id',
};

export const setupSocketMock = () => {
  jest.doMock('socket.io-client', () => ({
    __esModule: true,
    default: jest.fn(() => mockSocket),
    io: jest.fn(() => mockSocket),
  }));
  return mockSocket;
};

// Setup DOM polyfills pour tests
export const setupDOMPolyfills = () => {
  // Mock window.scrollTo
  if (typeof window !== 'undefined') {
    window.scrollTo = jest.fn();
    window.scrollBy = jest.fn();
    
    // Mock window.location
    delete (window as any).location;
    window.location = {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      toString: jest.fn(() => 'http://localhost:3000'),
    } as any;
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: { ...localStorageMock },
    });
  }
};

// Setup performance mocks
export const setupPerformanceMocks = () => {
  if (typeof window !== 'undefined' && !window.performance) {
    window.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
      timing: {},
      navigation: {},
    } as any;
  }
  
  // Mock PerformanceObserver
  global.PerformanceObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => []),
  }));
};

// Setup all mocks - Centralisé et complet
export const setupAllMocks = () => {
  setupCanvasMock();
  setupGlobalFetch();
  setupSocketMock();
  mockRecharts();
  mockD3();
  setupDOMPolyfills();
  setupPerformanceMocks();
};

// Setup complet pour tests - utilise les mocks standardisés
export const setupCompleteTestEnvironment = () => {
  const setup = defaultJestSetup();
  setupAllMocks();
  return setup;
};

// Helper pour nettoyer après tests
export const cleanupAfterTest = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Nettoyer les événements
  if (typeof window !== 'undefined') {
    window.removeEventListener = jest.fn();
  }
};

// Helper pour mock les réponses API - Amélioré
export const mockApiResponse = (url: string, response: unknown, status = 200) => {
  const mockFetch = jest.fn().mockImplementation((requestUrl) => {
    if (requestUrl.includes(url)) {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: new Map(),
        json: async () => response,
        text: async () => JSON.stringify(response),
        blob: async () => new Blob([JSON.stringify(response)]),
        arrayBuffer: async () => new ArrayBuffer(0),
        clone: function() { return this; },
        body: null,
        bodyUsed: false,
        url: requestUrl,
        type: 'basic',
        redirected: false,
      });
    }
    return Promise.reject(new Error(`Not found: ${requestUrl}`));
  });
  
  global.fetch = mockFetch;
  return mockFetch;
};

// Helper pour mock plusieurs endpoints
export const mockMultipleApiResponses = (endpoints: Record<string, { response: unknown; status?: number }>) => {
  const mockFetch = jest.fn().mockImplementation((requestUrl) => {
    for (const [url, config] of Object.entries(endpoints)) {
      if (requestUrl.includes(url)) {
        const status = config.status || 200;
        return Promise.resolve({
          ok: status >= 200 && status < 300,
          status,
          statusText: status === 200 ? 'OK' : 'Error',
          headers: new Map(),
          json: async () => config.response,
          text: async () => JSON.stringify(config.response),
          blob: async () => new Blob([JSON.stringify(config.response)]),
          clone: function() { return this; },
        });
      }
    }
    return Promise.reject(new Error(`No mock found for: ${requestUrl}`));
  });
  
  global.fetch = mockFetch;
  return mockFetch;
};

// Helpers pour tests async - Améliorés
export const waitForLoadingToFinish = (timeout = 5000) =>
  waitFor(() => {
    const loaders = screen.queryAllByTestId(/loading/i);
    const spinners = screen.queryAllByRole('progressbar');
    const loadingTexts = screen.queryAllByText(/loading|chargement/i);
    expect([...loaders, ...spinners, ...loadingTexts]).toHaveLength(0);
  }, { timeout });

// Helper pour attendre qu'un élément apparaisse
export const waitForElement = (selector: string, timeout = 5000) =>
  waitFor(() => {
    const element = screen.getByTestId(selector) || screen.getByRole(selector) || screen.getByText(selector);
    expect(element).toBeInTheDocument();
    return element;
  }, { timeout });

// Helper pour attendre qu'une requête soit faite
export const waitForApiCall = (mockFetch: jest.MockedFunction<any>, url: string, timeout = 5000) =>
  waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(url), expect.any(Object));
  }, { timeout });

// Helper pour tests de formulaires
export const fillFormField = async (label: string, value: string) => {
  const field = screen.getByLabelText(label) || screen.getByPlaceholderText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
  return field;
};

// Helper pour tests de boutons
export const clickButton = async (text: string) => {
  const button = screen.getByRole('button', { name: text }) || screen.getByText(text);
  await userEvent.click(button);
  return button;
};

// Mock common API responses - Données de test réalistes
export const mockApiResponses = {
  simulationData: {
    id: '1',
    name: 'Test Simulation',
    status: 'completed',
    createdAt: '2025-05-30T10:00:00Z',
    updatedAt: '2025-05-30T10:30:00Z',
    results: {
      coverage: 95,
      conflicts: [],
      recommendations: [],
      metrics: {
        totalUsers: 10,
        assignedUsers: 9,
        conflictCount: 0,
      },
    },
  },
  chartData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai'],
    datasets: [{
      label: 'Test Data',
      data: [10, 20, 30, 25, 35],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    }],
  },
  userData: {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      phone: '+33123456789',
    },
  },
  leaveData: {
    id: 'leave-1',
    userId: 1,
    type: 'ANNUAL',
    startDate: '2025-06-01',
    endDate: '2025-06-03',
    status: 'PENDING',
    countedDays: 3,
    reason: 'Vacances été',
  },
  planningData: {
    id: 'planning-1',
    date: '2025-06-01',
    assignments: [
      {
        id: 'assign-1',
        userId: 1,
        operatingRoomId: 'room-1',
        startTime: '08:00',
        endTime: '17:00',
        type: 'GARDE',
      },
    ],
  },
};

// Export userEvent pour tests interactifs
export { userEvent };

// Export du setup complet pour utilisation dans jest.setup.js
export { setupCompleteTestEnvironment as default };