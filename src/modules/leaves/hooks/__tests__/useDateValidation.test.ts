import { renderHook, act } from '@testing-library/react';
import { useDateValidation } from '../useDateValidation';

describe('useDateValidation', () => {
    it('should initialize correctly', () => {
        const { result } = renderHook(() => useDateValidation());
        
        expect(result.current.errors).toEqual([]);
        expect(result.current.hasErrors()).toBe(false);
        expect(typeof result.current.validateDate).toBe('function');
        expect(typeof result.current.validateDateRange).toBe('function');
        expect(typeof result.current.resetErrors).toBe('function');
    });

    it('should validate a valid date', () => {
        const { result } = renderHook(() => useDateValidation());
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        act(() => {
            const isValid = result.current.validateDate(tomorrow, 'testDate', { required: true });
            expect(isValid).toBe(true);
        });

        expect(result.current.errors).toEqual([]);
    });

    it('should reject null date when required', () => {
        const { result } = renderHook(() => useDateValidation());

        act(() => {
            const isValid = result.current.validateDate(null, 'testDate', { required: true });
            expect(isValid).toBe(false);
        });

        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0].field).toBe('testDate');
        expect(result.current.errors[0].type).toBe('required');
    });

    it('should reject past dates when not allowed', () => {
        const { result } = renderHook(() => useDateValidation());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        act(() => {
            const isValid = result.current.validateDate(yesterday, 'testDate', { 
                required: true, 
                allowPastDates: false 
            });
            expect(isValid).toBe(false);
        });

        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0].type).toBe('past_date');
    });

    it('should validate date range correctly', () => {
        const { result } = renderHook(() => useDateValidation());
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 5);

        act(() => {
            const isValid = result.current.validateDateRange(
                startDate, 
                endDate, 
                'startDate', 
                'endDate', 
                { required: true }
            );
            expect(isValid).toBe(true);
        });

        expect(result.current.errors).toEqual([]);
    });

    it('should reject invalid date range (start after end)', () => {
        const { result } = renderHook(() => useDateValidation());
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);

        act(() => {
            const isValid = result.current.validateDateRange(
                startDate, 
                endDate, 
                'startDate', 
                'endDate', 
                { required: true }
            );
            expect(isValid).toBe(false);
        });

        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0].type).toBe('range_invalid');
    });

    it('should reset errors correctly', () => {
        const { result } = renderHook(() => useDateValidation());

        // Add an error first
        act(() => {
            result.current.validateDate(null, 'testDate', { required: true });
        });

        expect(result.current.errors).toHaveLength(1);

        // Reset errors
        act(() => {
            result.current.resetErrors();
        });

        expect(result.current.errors).toEqual([]);
        expect(result.current.hasErrors()).toBe(false);
    });

    it('should get field errors correctly', () => {
        const { result } = renderHook(() => useDateValidation());

        act(() => {
            result.current.validateDate(null, 'field1', { required: true });
            result.current.validateDate(null, 'field2', { required: true });
        });

        expect(result.current.getFieldErrors('field1')).toHaveLength(1);
        expect(result.current.getFieldErrors('field2')).toHaveLength(1);
        expect(result.current.getFieldErrors('field3')).toHaveLength(0);
    });
});