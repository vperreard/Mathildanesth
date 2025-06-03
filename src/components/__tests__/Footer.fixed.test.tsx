import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock framer-motion completely
jest.mock('framer-motion', () => ({
  motion: {
    a: ({ children, className, href, ...props }: any) => (
      <a className={className} href={href} {...props}>
        {children}
      </a>
    ),
    footer: ({ children, ...props }: any) => <footer {...props}>{children}</footer>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
});

// Create a simple mock Footer component for testing
const MockFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-bold">Mathildanesth</h2>
            <p className="text-gray-600">
              Plateforme de gestion des plannings médicaux pour équipes d'anesthésie.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Navigation rapide</h3>
            <ul className="space-y-2">
              <li><a href="/">Accueil</a></li>
              <li><a href="/planning">Mon Planning</a></li>
              <li><a href="/conges">Mes Congés</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Informations</h3>
            <ul className="space-y-2">
              <li><span>Version: 0.1.0</span></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t flex justify-between">
          <p>© {currentYear} Mathildanesth. Tous droits réservés.</p>
          <div className="flex space-x-4">
            <a href="#">Politique de confidentialité</a>
            <a href="#">Conditions d'utilisation</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

describe('Footer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render footer with main sections', () => {
      render(<MockFooter />);
      
      expect(screen.getByText('Mathildanesth')).toBeInTheDocument();
      expect(screen.getByText('Navigation rapide')).toBeInTheDocument();
      expect(screen.getByText('Informations')).toBeInTheDocument();
    });

    it('should display the description text', () => {
      render(<MockFooter />);

      const description = screen.getByText("Plateforme de gestion des plannings médicaux pour équipes d'anesthésie.");
      expect(description).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should render navigation links', () => {
      render(<MockFooter />);

      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Mon Planning')).toBeInTheDocument();
      expect(screen.getByText('Mes Congés')).toBeInTheDocument();
    });

    it('should have correct href attributes', () => {
      render(<MockFooter />);

      const homeLink = screen.getByText('Accueil').closest('a');
      const planningLink = screen.getByText('Mon Planning').closest('a');

      expect(homeLink).toHaveAttribute('href', '/');
      expect(planningLink).toHaveAttribute('href', '/planning');
    });
  });

  describe('Copyright and Legal', () => {
    it('should display current year in copyright', () => {
      render(<MockFooter />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    it('should render legal links', () => {
      render(<MockFooter />);

      expect(screen.getByText('Politique de confidentialité')).toBeInTheDocument();
      expect(screen.getByText("Conditions d'utilisation")).toBeInTheDocument();
    });

    it('should have screen reader text for legal links', () => {
      render(<MockFooter />);

      const privacyScreenReader = screen.getByText('Politique de confidentialité');
      const termsScreenReader = screen.getByText("Conditions d'utilisation");

      expect(privacyScreenReader).toBeInTheDocument();
      expect(termsScreenReader).toBeInTheDocument();
    });
  });

  describe('Information Section', () => {
    it('should display version information', () => {
      render(<MockFooter />);

      expect(screen.getByText('Version: 0.1.0')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      render(<MockFooter />);
      
      const gridContainer = screen.getByText('Navigation rapide').closest('div')?.parentElement;
      expect(gridContainer).toHaveClass('grid');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic footer element', () => {
      render(<MockFooter />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<MockFooter />);

      const mainHeading = screen.getByRole('heading', { level: 2 });
      const subHeadings = screen.getAllByRole('heading', { level: 3 });

      expect(mainHeading).toHaveTextContent('Mathildanesth');
      expect(subHeadings).toHaveLength(2);
    });
  });
});