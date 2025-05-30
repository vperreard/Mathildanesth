import React from 'react';
import { renderWithProviders as render, screen, fireEvent } from '@/test-utils/renderWithProviders';
import { ReactNode } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import * as errorLoggingService from '../../services/errorLoggingService';

// Mock the error logging service
jest.mock('../../services/errorLoggingService', () => ({
  logError: jest.fn(),
}));

// Mock ErrorDisplay component
jest.mock('../ErrorDisplay', () => {
  return function MockErrorDisplay({ error, resetError }: { error: Error; resetError: () => void }) {
    return (
      <div data-testid="error-display">
        <p>Default Error: {error.message}</p>
        <button onClick={resetError} data-testid="default-reset-button">
          Reset
        </button>
      </div>
    );
  };
});

// Component that throws an error
const ThrowError = ({ shouldThrow = true, message = 'Test error' }: { shouldThrow?: boolean; message?: string }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="success-component">Success</div>;
};

// Custom fallback component
const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div data-testid="custom-fallback">
    <p>Custom Error: {error.message}</p>
    <button onClick={resetError} data-testid="custom-reset-button">
      Try Again
    </button>
  </div>
);

// Simple fallback element
const SimpleFallback = <div data-testid="simple-fallback">Something went wrong</div>;

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for error boundary tests
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Normal operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });

    it('should render multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch errors and display default error component', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="Component error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Default Error: Component error')).toBeInTheDocument();
    });

    it('should catch errors and display custom fallback component', () => {
      render(
        <ErrorBoundary fallbackComponent={CustomFallback}>
          <ThrowError message="Custom error" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error: Custom error')).toBeInTheDocument();
    });

    it('should catch errors and display simple fallback element', () => {
      render(
        <ErrorBoundary fallback={SimpleFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('simple-fallback')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should prioritize fallbackComponent over fallback prop', () => {
      render(
        <ErrorBoundary 
          fallbackComponent={CustomFallback}
          fallback={SimpleFallback}
        >
          <ThrowError message="Priority test" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('simple-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Error logging', () => {
    it('should log errors to the error logging service', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="Logged error" />
        </ErrorBoundary>
      );

      expect(errorLoggingService.logError).toHaveBeenCalledWith(
        'react_error_boundary',
        expect.objectContaining({
          message: 'Logged error',
          severity: 'error',
          timestamp: expect.any(Date),
          context: expect.objectContaining({
            componentStack: expect.any(String),
            stack: expect.any(String),
          }),
        })
      );
    });

    it('should call custom onError handler when provided', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError message="Handler test" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Handler test' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('Error recovery', () => {
    it('should reset error state when reset button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError message="Reset test" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('default-reset-button'));

      // After reset, the component should try to render children again
      // Since ThrowError still throws by default, it will error again
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    it('should reset error state with custom fallback component', () => {
      render(
        <ErrorBoundary fallbackComponent={CustomFallback}>
          <ThrowError message="Custom reset test" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('custom-reset-button'));

      // Component should try to render again and error again
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    it('should successfully recover when error condition is resolved', () => {
      let shouldThrow = true;

      const DynamicComponent = () => <ThrowError shouldThrow={shouldThrow} />;

      const { rerender } = render(
        <ErrorBoundary>
          <DynamicComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click reset
      fireEvent.click(screen.getByTestId('default-reset-button'));

      // Rerender with fixed component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });
  });

  describe('Props change handling', () => {
    it('should reset error state when children change and resetOnPropsChange is true', () => {
      let childKey = 'child1';

      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowError key={childKey} message="Props change test" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();

      // Change children
      childKey = 'child2';
      rerender(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowError key={childKey} shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });

    it('should not reset error state when children change and resetOnPropsChange is false', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={false}>
          <ThrowError message="No reset test" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();

      // Change children
      rerender(
        <ErrorBoundary resetOnPropsChange={false}>
          <div>New child</div>
        </ErrorBoundary>
      );

      // Should still show error display
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    it('should not reset error state when resetOnPropsChange is undefined', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError message="Undefined reset test" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();

      // Change children
      rerender(
        <ErrorBoundary>
          <div>New child</div>
        </ErrorBoundary>
      );

      // Should still show error display
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle nested error boundaries', () => {
      const InnerError = () => {
        throw new Error('Inner error');
      };

      render(
        <ErrorBoundary fallback={<div data-testid="outer-fallback">Outer Error</div>}>
          <div>
            <ErrorBoundary fallback={<div data-testid="inner-fallback">Inner Error</div>}>
              <InnerError />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('inner-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('outer-fallback')).not.toBeInTheDocument();
    });

    it('should handle errors with complex error messages', () => {
      const complexError = new Error('Complex error\nwith\nmultiple\nlines\nand\tspecial\tchars');

      const ComplexErrorComponent = () => {
        throw complexError;
      };

      render(
        <ErrorBoundary>
          <ComplexErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(errorLoggingService.logError).toHaveBeenCalledWith(
        'react_error_boundary',
        expect.objectContaining({
          message: expect.stringContaining('Complex error'),
        })
      );
    });

    it('should handle errors thrown during lifecycle methods', () => {
      class LifecycleError extends React.Component {
        componentDidMount() {
          throw new Error('Lifecycle error');
        }

        render() {
          return <div>This should not render</div>;
        }
      }

      render(
        <ErrorBoundary>
          <LifecycleError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    it('should handle null/undefined children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
          {undefined}
          <div data-testid="valid-child">Valid content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('valid-child')).toBeInTheDocument();
    });
  });

  describe('Performance considerations', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return <div>Test</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(renderSpy).toHaveBeenCalledTimes(2); // Normal re-render behavior
    });
  });
});
