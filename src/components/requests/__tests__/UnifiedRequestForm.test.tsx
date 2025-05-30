import { renderWithProviders as render, screen, fireEvent, waitFor } from '@/test-utils/renderWithProviders';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UnifiedRequestForm from '../UnifiedRequestForm';
import { UnifiedRequestType, RequestPriority } from '@/types/unified-request';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock lucide-react icons

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, format) => `formatted-${format}`),
}));

jest.mock('date-fns/locale', () => ({
  fr: {},
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h3 data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, ...props }: any) => (
    <p data-testid="card-description" {...props}>
      {children}
    </p>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, type, ...props }: any) => (
    <input
      type={type || 'text'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid={props['data-testid'] || 'input'}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid={props['data-testid'] || 'textarea'}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, defaultValue, ...props }: any) => (
    <div data-testid="select-wrapper">
      <select
        onChange={(e) => onValueChange?.(e.target.value)}
        defaultValue={defaultValue}
        data-testid="select"
        {...props}
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect, selected, ...props }: any) => (
    <div data-testid="calendar">
      <button
        onClick={() => onSelect?.(new Date('2024-12-25'))}
        data-testid="calendar-date-picker"
      >
        Select Date
      </button>
    </div>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div data-testid="popover">{children}</div>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
}));

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ onValueChange, children, ...props }: any) => (
    <div data-testid="radio-group" onChange={(e: any) => onValueChange?.(e.target.value)} {...props}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id, ...props }: any) => (
    <input type="radio" value={value} id={id} data-testid={`radio-${value}`} {...props} />
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, ...props }: any) => (
    <div data-testid="alert" className={className} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Test wrapper with React Query
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('UnifiedRequestForm', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  };

  const defaultProps = {
    userId: 123,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Initial Rendering', () => {
    it('should render request type selection by default', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Type de demande')).toBeInTheDocument();
      expect(screen.getByText('Demande de congé')).toBeInTheDocument();
      expect(screen.getByText('Échange de garde')).toBeInTheDocument();
      expect(screen.getByText('Remplacement urgent')).toBeInTheDocument();
      expect(screen.getByText('Modification planning')).toBeInTheDocument();
      expect(screen.getByText('Formation')).toBeInTheDocument();
    });

    it('should render with preselected type', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      // Should skip type selection and go directly to form
      expect(screen.getByText('Demande de congé')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toBeInTheDocument(); // Form fields should be visible
    });

    it('should display correct icons for each request type', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('calendar-off-icon')).toBeInTheDocument();
      expect(screen.getByTestId('swap-icon')).toBeInTheDocument();
      expect(screen.getByTestId('siren-icon')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('graduation-icon')).toBeInTheDocument();
    });
  });

  describe('Request Type Selection', () => {
    it('should handle request type selection', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm {...defaultProps} />
        </TestWrapper>
      );

      const leaveCard = screen.getByText('Demande de congé').closest('[data-testid="card"]');
      expect(leaveCard).toBeInTheDocument();

      await user.click(leaveCard!);

      // Should proceed to form with leave type selected
      await waitFor(() => {
        expect(screen.getByText('Détails de la demande')).toBeInTheDocument();
      });
    });

    it('should handle different request types correctly', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm {...defaultProps} />
        </TestWrapper>
      );

      // Test emergency replacement selection
      const emergencyCard = screen.getByText('Remplacement urgent').closest('[data-testid="card"]');
      await user.click(emergencyCard!);

      await waitFor(() => {
        expect(screen.getByText('Remplacement urgent')).toBeInTheDocument();
        expect(screen.getByTestId('select')).toBeInTheDocument(); // Priority selector should appear
      });
    });
  });

  describe('Form Fields', () => {
    it('should render basic form fields for leave request', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/objet/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date de début/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date de fin/i)).toBeInTheDocument();
    });

    it('should show priority field for urgent requests', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.EMERGENCY_REPLACEMENT}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/priorité/i)).toBeInTheDocument();
      expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('should handle date selection', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      const dateButton = screen.getByText('Sélectionner une date');
      await user.click(dateButton);

      expect(screen.getByTestId('calendar')).toBeInTheDocument();

      const datePickerButton = screen.getByTestId('calendar-date-picker');
      await user.click(datePickerButton);

      // Date should be selected (mocked format function)
      expect(screen.getByText('formatted-PPP')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/veuillez remplir tous les champs requis/i)).toBeInTheDocument();
      });
    });

    it('should validate date ranges', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      // Set end date before start date
      const startDateInput = screen.getByLabelText(/date de début/i);
      const endDateInput = screen.getByLabelText(/date de fin/i);

      await user.type(startDateInput, '2024-12-31');
      await user.type(endDateInput, '2024-01-01');

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/date de fin antérieure au début/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid request successfully', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      mockedAxios.post.mockResolvedValue({
        data: { success: true, id: 'req-123' }
      });

      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/objet/i), 'Congés d\'été');
      await user.type(screen.getByLabelText(/description/i), 'Demande de congés pour vacances');
      await user.type(screen.getByLabelText(/date de début/i), '2024-07-01');
      await user.type(screen.getByLabelText(/date de fin/i), '2024-07-15');

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/unified-requests', {
          userId: 123,
          type: UnifiedRequestType.LEAVE,
          subject: 'Congés d\'été',
          description: 'Demande de congés pour vacances',
          startDate: '2024-07-01',
          endDate: '2024-07-15',
          priority: RequestPriority.NORMAL,
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Demande soumise avec succès');
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      mockedAxios.post.mockRejectedValue(new Error('Server error'));

      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/objet/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.type(screen.getByLabelText(/date de début/i), '2024-07-01');
      await user.type(screen.getByLabelText(/date de fin/i), '2024-07-15');

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erreur lors de la soumission');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockedAxios.post.mockReturnValue(pendingPromise);

      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/objet/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.type(screen.getByLabelText(/date de début/i), '2024-07-01');
      await user.type(screen.getByLabelText(/date de fin/i), '2024-07-15');

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Soumission en cours...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({ data: { success: true } });

      await waitFor(() => {
        expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
      });
    });

    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup();
      const onSuccessMock = jest.fn();
      const TestWrapper = createTestWrapper();
      
      mockedAxios.post.mockResolvedValue({
        data: { success: true }
      });

      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
            onSuccess={onSuccessMock}
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/objet/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.type(screen.getByLabelText(/date de début/i), '2024-07-01');
      await user.type(screen.getByLabelText(/date de fin/i), '2024-07-15');

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should allow going back to type selection', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      const backButton = screen.getByText('Retour');
      await user.click(backButton);

      expect(screen.getByText('Type de demande')).toBeInTheDocument();
    });

    it('should redirect after successful submission when no onSuccess provided', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      mockedAxios.post.mockResolvedValue({
        data: { success: true }
      });

      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/objet/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.type(screen.getByLabelText(/date de début/i), '2024-07-01');
      await user.type(screen.getByLabelText(/date de fin/i), '2024-07-15');

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/requests');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/objet/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/description/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      await user.tab();
      expect(screen.getByLabelText(/objet/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();
    });

    it('should announce validation errors for screen readers', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByTestId('alert');
        expect(errorAlert).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid user ID gracefully', () => {
      const TestWrapper = createTestWrapper();
      
      expect(() => {
        render(
          <TestWrapper>
            <UnifiedRequestForm userId={-1} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/objet/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.type(screen.getByLabelText(/date de début/i), '2024-07-01');
      await user.type(screen.getByLabelText(/date de fin/i), '2024-07-15');

      const submitButton = screen.getByText('Soumettre la demande');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erreur lors de la soumission');
      });
    });

    it('should handle very long input values', async () => {
      const user = userEvent.setup();
      const TestWrapper = createTestWrapper();
      
      render(
        <TestWrapper>
          <UnifiedRequestForm 
            {...defaultProps} 
            preselectedType={UnifiedRequestType.LEAVE}
          />
        </TestWrapper>
      );

      const longSubject = 'A'.repeat(200);
      const subjectField = screen.getByLabelText(/objet/i);
      
      await user.type(subjectField, longSubject);
      
      // Should handle long input gracefully
      expect(subjectField).toHaveValue(longSubject);
    });
  });
});
