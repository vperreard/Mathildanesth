// Common test setup and global mocks
import React from 'react';

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
  jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => children,
    BarChart: ({ children }: any) => children,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Cell: () => null,
    CartesianGrid: () => null,
    PieChart: ({ children }: any) => children,
    Pie: () => null,
    LineChart: ({ children }: any) => children,
    Line: () => null,
    Area: () => null,
    AreaChart: ({ children }: any) => children,
    RadialBarChart: ({ children }: any) => children,
    RadialBar: () => null,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    Sankey: () => null,
  }));
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

// Mock common API responses
export const mockApiResponses = {
  simulationData: {
    id: '1',
    name: 'Test Simulation',
    status: 'completed',
    results: {
      coverage: 95,
      conflicts: [],
      recommendations: [],
    },
  },
  chartData: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Test Data',
      data: [10, 20, 30],
    }],
  },
};

// Setup all mocks
export const setupAllMocks = () => {
  setupCanvasMock();
  mockRecharts();
  mockD3();
};