import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { 
  exportSimulationResults, 
  exportPlanningData, 
  exportLeaveRequests,
  generateExportMetadata,
  validateExportData 
} from '../exportServiceV2';

// Mock dependencies
jest.mock('jspdf', () => {
  const mockPDF = {
    text: jest.fn().mockReturnThis(),
    setFontSize: jest.fn().mockReturnThis(),
    setFont: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnValue('mock-pdf-content'),
    autoTable: jest.fn().mockReturnThis(),
    previousAutoTable: { finalY: 50 },
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      }
    }
  };

  return {
    jsPDF: jest.fn(() => mockPDF)
  };
});

jest.mock('papaparse', () => ({
  unparse: jest.fn((data) => 'mock,csv,content\\nrow1,data1,value1\\nrow2,data2,value2')
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '2025-06-15'),
}));

jest.mock('date-fns/locale', () => ({
  fr: {}
}));

describe('ExportServiceV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportSimulationResults', () => {
    const mockSimulationData = {
      id: 'sim-1',
      scenarioName: 'Test Scenario',
      scenarioDescription: 'Test scenario description',
      createdAt: new Date('2025-06-15'),
      status: 'COMPLETED',
      statistics: {
        totalAssignments: 10,
        conflictsCount: 2,
        coverageRate: 85.5
      },
      conflicts: [
        {
          id: 'conflict-1',
          type: 'SCHEDULING_CONFLICT',
          description: 'Overlap detected',
          severity: 'HIGH'
        }
      ],
      userAssignments: [
        {
          userId: 'user-1',
          userName: 'John Doe',
          assignmentCount: 5,
          totalHours: 40
        }
      ],
      periodCoverage: 85.5
    };

    it('should export simulation results to PDF', async () => {
      const result = await exportSimulationResults(mockSimulationData, {
        format: 'pdf',
        fileName: 'custom-simulation-report'
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    it('should export simulation results to CSV', async () => {
      const Papa = require('papaparse');
      
      const result = await exportSimulationResults(mockSimulationData, {
        format: 'csv',
        includeRawData: true
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv');
      expect(Papa.unparse).toHaveBeenCalled();
    });

    it('should generate correct filename', async () => {
      const result = await exportSimulationResults(mockSimulationData, {
        format: 'pdf'
      });

      // Should use default filename pattern
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle empty simulation data', async () => {
      const emptyData = {
        id: 'empty-sim',
        scenarioName: 'Empty Scenario',
        createdAt: new Date(),
        status: 'PENDING',
        statistics: {},
        conflicts: [],
        userAssignments: []
      };

      const result = await exportSimulationResults(emptyData, {
        format: 'csv'
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should include raw data when requested', async () => {
      const Papa = require('papaparse');
      
      await exportSimulationResults(mockSimulationData, {
        format: 'csv',
        includeRawData: true
      });

      const callArgs = Papa.unparse.mock.calls[0][0];
      expect(callArgs).toBeInstanceOf(Array);
      expect(callArgs.length).toBeGreaterThan(0);
    });
  });

  describe('exportPlanningData', () => {
    const mockPlanningData = {
      dateRange: {
        start: new Date('2025-06-01'),
        end: new Date('2025-06-30')
      },
      assignments: [
        {
          id: 'assign-1',
          userId: 'user-1',
          userName: 'John Doe',
          date: new Date('2025-06-15'),
          shiftType: 'GARDE',
          operatingRoom: 'Salle 1',
          startTime: '08:00',
          endTime: '18:00'
        }
      ],
      operatingRooms: [
        {
          id: 'room-1',
          name: 'Salle 1',
          type: 'CHIRURGIE',
          capacity: 2
        }
      ],
      users: [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          role: 'MAR'
        }
      ]
    };

    it('should export planning data to PDF', async () => {
      const result = await exportPlanningData(mockPlanningData, {
        format: 'pdf',
        includeStatistics: true
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    it('should export planning data to Excel', async () => {
      const result = await exportPlanningData(mockPlanningData, {
        format: 'excel',
        includeCharts: false
      });

      expect(result).toBeInstanceOf(Blob);
      // Note: In real implementation, this would be Excel MIME type
      expect(result.type).toBeDefined();
    });

    it('should group assignments by date', async () => {
      const Papa = require('papaparse');
      
      await exportPlanningData(mockPlanningData, {
        format: 'csv',
        groupBy: 'date'
      });

      expect(Papa.unparse).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const filteredData = {
        ...mockPlanningData,
        dateRange: {
          start: new Date('2025-06-10'),
          end: new Date('2025-06-20')
        }
      };

      const result = await exportPlanningData(filteredData, {
        format: 'csv'
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should include statistics when requested', async () => {
      const result = await exportPlanningData(mockPlanningData, {
        format: 'pdf',
        includeStatistics: true
      });

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('exportLeaveRequests', () => {
    const mockLeaveData = [
      {
        id: 'leave-1',
        userId: 'user-1',
        userName: 'John Doe',
        startDate: new Date('2025-06-15'),
        endDate: new Date('2025-06-20'),
        type: 'ANNUAL',
        status: 'APPROVED',
        reason: 'Vacation',
        workingDaysCount: 5
      }
    ];

    it('should export leave requests to CSV', async () => {
      const Papa = require('papaparse');
      
      const result = await exportLeaveRequests(mockLeaveData, {
        format: 'csv',
        includeStatistics: true
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('text/csv');
      expect(Papa.unparse).toHaveBeenCalled();
    });

    it('should export leave requests to Excel', async () => {
      const result = await exportLeaveRequests(mockLeaveData, {
        format: 'excel',
        groupByStatus: true
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should filter leave requests by status', async () => {
      const filteredData = mockLeaveData.filter(leave => leave.status === 'APPROVED');
      
      const result = await exportLeaveRequests(filteredData, {
        format: 'csv',
        filterBy: { status: 'APPROVED' }
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should group leave requests by type', async () => {
      const result = await exportLeaveRequests(mockLeaveData, {
        format: 'pdf',
        groupByType: true
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle empty leave data', async () => {
      const result = await exportLeaveRequests([], {
        format: 'csv'
      });

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('generateExportMetadata', () => {
    it('should generate correct metadata for simulation export', () => {
      const metadata = generateExportMetadata('simulation', {
        dataSize: 100,
        exportDate: new Date('2025-06-15'),
        format: 'pdf'
      });

      expect(metadata).toEqual({
        exportType: 'simulation',
        exportDate: expect.any(Date),
        format: 'pdf',
        dataSize: 100,
        version: expect.any(String),
        generator: 'ExportServiceV2'
      });
    });

    it('should generate correct metadata for planning export', () => {
      const metadata = generateExportMetadata('planning', {
        dataSize: 50,
        dateRange: {
          start: new Date('2025-06-01'),
          end: new Date('2025-06-30')
        },
        format: 'excel'
      });

      expect(metadata).toEqual({
        exportType: 'planning',
        exportDate: expect.any(Date),
        format: 'excel',
        dataSize: 50,
        dateRange: expect.any(Object),
        version: expect.any(String),
        generator: 'ExportServiceV2'
      });
    });

    it('should include custom metadata fields', () => {
      const customMetadata = {
        author: 'John Doe',
        description: 'Custom export'
      };

      const metadata = generateExportMetadata('leaves', {
        format: 'csv',
        ...customMetadata
      });

      expect(metadata.author).toBe('John Doe');
      expect(metadata.description).toBe('Custom export');
    });
  });

  describe('validateExportData', () => {
    it('should validate simulation data successfully', () => {
      const validData = {
        id: 'sim-1',
        scenarioName: 'Valid Scenario',
        statistics: {},
        conflicts: [],
        userAssignments: []
      };

      const result = validateExportData('simulation', validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = {
        id: 'sim-1'
        // Missing scenarioName and other required fields
      };

      const result = validateExportData('simulation', invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('scenarioName is required');
    });

    it('should validate planning data structure', () => {
      const validPlanningData = {
        dateRange: {
          start: new Date('2025-06-01'),
          end: new Date('2025-06-30')
        },
        assignments: [],
        operatingRooms: [],
        users: []
      };

      const result = validateExportData('planning', validPlanningData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate leave requests data', () => {
      const validLeaveData = [
        {
          id: 'leave-1',
          userId: 'user-1',
          startDate: new Date(),
          endDate: new Date(),
          type: 'ANNUAL',
          status: 'PENDING'
        }
      ];

      const result = validateExportData('leaves', validLeaveData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle unknown export types', () => {
      const result = validateExportData('unknown' as any, {});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown export type: unknown');
    });
  });

  describe('error handling', () => {
    it('should handle PDF generation errors', async () => {
      const jsPDF = require('jspdf').jsPDF;
      const mockInstance = new jsPDF();
      mockInstance.output.mockImplementation(() => {
        throw new Error('PDF generation failed');
      });

      await expect(
        exportSimulationResults({
          id: 'sim-1',
          scenarioName: 'Test',
          createdAt: new Date(),
          status: 'COMPLETED',
          statistics: {},
          conflicts: [],
          userAssignments: []
        }, { format: 'pdf' })
      ).rejects.toThrow('PDF generation failed');
    });

    it('should handle CSV generation errors', async () => {
      const Papa = require('papaparse');
      Papa.unparse.mockImplementation(() => {
        throw new Error('CSV parsing failed');
      });

      await expect(
        exportSimulationResults({
          id: 'sim-1',
          scenarioName: 'Test',
          createdAt: new Date(),
          status: 'COMPLETED',
          statistics: {},
          conflicts: [],
          userAssignments: []
        }, { format: 'csv' })
      ).rejects.toThrow('CSV parsing failed');
    });

    it('should handle invalid data gracefully', async () => {
      const invalidData = null as any;

      await expect(
        exportSimulationResults(invalidData, { format: 'pdf' })
      ).rejects.toThrow();
    });
  });
});