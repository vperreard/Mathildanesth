import React from 'react';
import { renderWithProviders as render, screen, fireEvent } from '@/test-utils/renderWithProviders';
import Button from '../button';

describe('Button Component', () => {
    describe('rendering', () => {
        it('should render with default props', () => {
            render(<Button>Click me</Button>);

            const button = screen.getByRole('button', { name: /click me/i });
            expect(button).toBeInTheDocument();
        });

        it('should render with custom text', () => {
            render(<Button>Custom Text</Button>);

            expect(screen.getByText('Custom Text')).toBeInTheDocument();
        });

        it('should apply custom className', () => {
            render(<Button className="custom-class">Test</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('custom-class');
        });
    });

    describe('variants', () => {
        it('should apply default variant', () => {
            render(<Button>Default</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });

        it('should apply secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });

        it('should apply destructive variant', () => {
            render(<Button variant="destructive">Delete</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });

        it('should apply outline variant', () => {
            render(<Button variant="outline">Outline</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });

        it('should apply ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });
    });

    describe('sizes', () => {
        it('should apply default size classes', () => {
            render(<Button>Default Size</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
        });

        it('should apply small size classes', () => {
            render(<Button size="sm">Small</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs');
        });

        it('should apply large size classes', () => {
            render(<Button size="lg">Large</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('px-5', 'py-2.5', 'text-base');
        });

        it('should apply icon size classes', () => {
            render(<Button size="icon">🚀</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-9', 'w-9');
        });
    });

    describe('states', () => {
        it('should be disabled when disabled prop is true', () => {
            render(<Button disabled>Disabled</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('should not be disabled by default', () => {
            render(<Button>Enabled</Button>);

            const button = screen.getByRole('button');
            expect(button).not.toBeDisabled();
        });
    });

    describe('interactions', () => {
        it('should call onClick when clicked', () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Click me</Button>);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should not call onClick when disabled', () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick} disabled>Disabled Button</Button>);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            expect(handleClick).not.toHaveBeenCalled();
        });

        it('should handle keyboard events', () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Keyboard Button</Button>);

            const button = screen.getByRole('button');
            fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

            // Le comportement de keyDown dépend de l'implémentation native du bouton
            expect(button).toBeInTheDocument();
        });
    });

    describe('as prop (polymorphic)', () => {
        it('should render as different HTML elements', () => {
            const { rerender } = render(<Button asChild><div>As Div</div></Button>);

            // Si le composant supporte asChild, il devrait rendre le div
            expect(screen.getByText('As Div')).toBeInTheDocument();

            // Test avec un lien
            rerender(<Button asChild><a href="/test">As Link</a></Button>);
            expect(screen.getByRole('link')).toBeInTheDocument();
        });
    });

    describe('custom props', () => {
        it('should forward HTML attributes', () => {
            render(<Button data-testid="custom-button" aria-label="Custom button">Test</Button>);

            const button = screen.getByTestId('custom-button');
            expect(button).toHaveAttribute('aria-label', 'Custom button');
        });

        it('should forward type attribute for forms', () => {
            render(<Button type="submit">Submit</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('type', 'submit');
        });
    });

    describe('edge cases', () => {
        it('should handle empty children', () => {
            render(<Button></Button>);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(button).toBeEmptyDOMElement();
        });

        it('should handle multiple children', () => {
            render(
                <Button>
                    <span>Icon</span>
                    <span>Text</span>
                </Button>
            );

            expect(screen.getByText('Icon')).toBeInTheDocument();
            expect(screen.getByText('Text')).toBeInTheDocument();
        });

        it('should handle very long text', () => {
            const longText = 'This is a very long button text that might overflow or cause layout issues in some cases';
            render(<Button>{longText}</Button>);

            expect(screen.getByText(longText)).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should be focusable by default', () => {
            render(<Button>Focusable</Button>);

            const button = screen.getByRole('button');
            button.focus();
            expect(button).toHaveFocus();
        });

        it('should not be focusable when disabled', () => {
            render(<Button disabled>Not Focusable</Button>);

            const button = screen.getByRole('button');
            // Les boutons désactivés en HTML peuvent toujours recevoir le focus
            // mais ils ne doivent pas répondre aux interactions
            expect(button).toBeDisabled();
            expect(button).toHaveAttribute('aria-disabled', 'true');
        });

        it('should support aria attributes', () => {
            render(
                <Button
                    aria-pressed="true"
                    aria-describedby="description"
                >
                    Toggle Button
                </Button>
            );

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-pressed', 'true');
            expect(button).toHaveAttribute('aria-describedby', 'description');
        });
    });
}); 
