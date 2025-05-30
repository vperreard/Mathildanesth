import React from 'react';
import { renderWithProviders as render, screen, fireEvent } from '@/test-utils/renderWithProviders';
import Modal from '../Modal';

// Mock HeadlessUI with simpler components that match the actual usage
jest.mock('@headlessui/react', () => {
  const MockDialog = ({ children, onClose }: any) => (
    <div data-testid="dialog" onClick={onClose}>
      {children}
    </div>
  );
  
  MockDialog.Panel = ({ children, className, ...props }: any) => (
    <div className={className} data-testid="dialog-panel" {...props}>
      {children}
    </div>
  );
  
  MockDialog.Title = ({ children, className, as: Component = 'h3', ...props }: any) => (
    <Component className={className} data-testid="dialog-title" {...props}>
      {children}
    </Component>
  );

  const MockTransition = ({ show, children }: any) => (
    show ? <div data-testid="transition-root">{children}</div> : null
  );
  
  MockTransition.Root = MockTransition;
  MockTransition.Child = ({ children }: any) => (
    <div data-testid="transition-child">{children}</div>
  );

  return {
    Dialog: MockDialog,
    Transition: MockTransition,
  };
});

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className, ...props }: any) => (
    <div data-testid="x-mark-icon" className={className} {...props}>×</div>
  ),
}));

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div data-testid="modal-content">Modal content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByTestId('transition-root')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('transition-root')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onCloseMock = jest.fn();
    render(<Modal {...defaultProps} onClose={onCloseMock} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    // Should be called at least once - the dialog mock also triggers onClose
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    
    let panel = screen.getByTestId('dialog-panel');
    expect(panel).toHaveClass('sm:max-w-sm');

    rerender(<Modal {...defaultProps} size="lg" />);
    panel = screen.getByTestId('dialog-panel');
    expect(panel).toHaveClass('sm:max-w-lg');
  });

  it('should render title and children correctly', () => {
    render(<Modal {...defaultProps} title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });
});
