import { renderHook, act } from '@testing-library/react';
import { useLeaveCalculation } from '../useLeaveCalculation';
import { LeaveCalculationOptions } from '../../types/leave';

// Mock the dependencies
jest.mock('../../services/leaveCalculator', () => ({
  calculateLeaveCountedDays: jest.fn().mockResolvedValue({
    countedDays: 5,
    workDays: 7,
    publicHolidays: [],
    halfDays: 0,
  }),
  calculateWorkingDays: jest.fn().mockReturnValue(7),
  isBusinessDay: jest.fn().mockReturnValue(true),
}));

jest.mock('../../services/publicHolidayService', () => ({
  publicHolidayService: {
    getPublicHolidaysInRange: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../profiles/hooks/useUserWorkSchedule', () => ({
  useUserWorkSchedule: jest.fn().mockReturnValue({
    workSchedule: {
      id: 'test-schedule',
      userId: 1,
      frequency: 'FULL_TIME',
      weekType: 'BOTH',
      workingDays: [1, 2, 3, 4, 5],
      workingTimePercentage: 100,
      annualLeaveAllowance: 25,
      isActive: true,
      validFrom: new Date('2024-01-01'),
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/utils/logger', () => ({
  getLogger: jest.fn().mockResolvedValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('useLeaveCalculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not cause infinite loop when options change', async () => {
    const startDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-19');

    // Track how many times the hook rerenders
    let renderCount = 0;

    const { result, rerender } = renderHook(
      ({ options }: { options?: LeaveCalculationOptions }) => {
        renderCount++;
        return useLeaveCalculation({
          startDate,
          endDate,
          options,
        });
      },
      {
        initialProps: {
          options: {
            isHalfDay: false,
            halfDayPeriod: undefined,
          },
        },
      }
    );

    // Wait for initial calculation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const initialRenderCount = renderCount;

    // Change options with a new object reference (this used to cause infinite loop)
    rerender({
      options: {
        isHalfDay: true,
        halfDayPeriod: 'AM' as const,
      },
    });

    // Wait a bit to see if infinite loop occurs
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Should only have rendered a few times, not infinitely
    expect(renderCount).toBeLessThan(initialRenderCount + 5);
    expect(result.current.hasValidDates).toBe(true);
  });

  it('should handle stable options correctly', async () => {
    const startDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-19');

    const stableOptions: LeaveCalculationOptions = {
      isHalfDay: false,
      halfDayPeriod: undefined,
    };

    const { result } = renderHook(() =>
      useLeaveCalculation({
        startDate,
        endDate,
        options: stableOptions,
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.hasValidDates).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should recalculate when explicitly called', async () => {
    const startDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-19');

    const { result } = renderHook(() =>
      useLeaveCalculation({
        startDate,
        endDate,
        options: { isHalfDay: false },
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Call recalculate explicitly
    await act(async () => {
      await result.current.recalculate({ isHalfDay: true, halfDayPeriod: 'PM' });
    });

    expect(result.current.error).toBeNull();
  });
});
