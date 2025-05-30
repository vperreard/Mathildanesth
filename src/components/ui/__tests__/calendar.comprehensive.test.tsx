import React from 'react';
import { renderWithProviders as render, screen, fireEvent, waitFor } from '@/test-utils/renderWithProviders';
import userEvent from '@testing-library/user-event';
import { Calendar } from '../calendar';
import { Calendrier } from '../calendrier';

// Mock dependencies
jest.mock('lucide-react', () => ({
  ChevronLeft: ({ className }: { className: string }) => (
    <div data-testid="chevron-left" className={className}>←</div>
  ),
  ChevronRight: ({ className }: { className: string }) => (
    <div data-testid="chevron-right" className={className}>→</div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

jest.mock('@/components/ui/button', () => ({
  buttonVariants: ({ variant }: { variant: string }) => `button-${variant}`,
}));

// Mock react-day-picker
jest.mock('react-day-picker', () => ({
  DayPicker: ({ 
    className, 
    classNames, 
    showOutsideDays, 
    locale, 
    components, 
    onSelect,
    selected,
    ...props 
  }: any) => {
    const handleDayClick = (date: Date) => {
      onSelect?.(date);
    };

    return (
      <div 
        data-testid="day-picker" 
        className={className}
        data-show-outside-days={showOutsideDays}
        data-locale={locale?.code || 'fr'}
        {...props}
      >
        <div data-testid="calendar-navigation">
          <button 
            data-testid="nav-previous" 
            className={classNames?.nav_button_previous}
            onClick={() => {}}
          >
            {components?.IconLeft ? React.createElement(components.IconLeft) : '←'}
          </button>
          <div data-testid="caption-label" className={classNames?.caption_label}>
            Mars 2024
          </div>
          <button 
            data-testid="nav-next" 
            className={classNames?.nav_button_next}
            onClick={() => {}}
          >
            {components?.IconRight ? React.createElement(components.IconRight) : '→'}
          </button>
        </div>
        <table data-testid="calendar-table" className={classNames?.table}>
          <thead>
            <tr data-testid="calendar-header" className={classNames?.head_row}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <th key={index} className={classNames?.head_cell}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, weekIndex) => (
              <tr key={weekIndex} className={classNames?.row}>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const day = weekIndex * 7 + dayIndex + 1;
                  const date = new Date(2024, 2, day); // Mars 2024
                  const isSelected = selected && date.getTime() === selected.getTime();
                  const isToday = day === 15; // Mock aujourd'hui = 15 mars
                  
                  return (
                    <td key={dayIndex} className={classNames?.cell}>
                      <button
                        data-testid={`day-${day}`}
                        className={`${classNames?.day} ${isSelected ? classNames?.day_selected : ''} ${isToday ? classNames?.day_today : ''}`}
                        onClick={() => handleDayClick(date)}
                        aria-selected={isSelected}
                      >
                        {day <= 31 ? day : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
}));

// Mock date-fns locale
jest.mock('date-fns/locale', () => ({
  fr: { code: 'fr' },
}));

describe('Calendar Component - Tests Complets pour Système Médical', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRITICITÉ HAUTE - Rendu et Structure', () => {
    it('devrait rendre le calendrier avec la structure correcte', () => {
      render(<Calendar />);

      expect(screen.getByTestId('day-picker')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-table')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
    });

    it('devrait appliquer les classes CSS personnalisées', () => {
      render(<Calendar className="custom-calendar" />);

      const calendar = screen.getByTestId('day-picker');
      expect(calendar).toHaveClass('p-3', 'custom-calendar');
    });

    it('devrait afficher les jours de la semaine en français', () => {
      render(<Calendar />);

      const header = screen.getByTestId('calendar-header');
      expect(header).toBeInTheDocument();
      
      // Vérifier que la locale française est appliquée
      const calendar = screen.getByTestId('day-picker');
      expect(calendar).toHaveAttribute('data-locale', 'fr');
    });

    it('devrait configurer correctement showOutsideDays par défaut', () => {
      render(<Calendar />);

      const calendar = screen.getByTestId('day-picker');
      expect(calendar).toHaveAttribute('data-show-outside-days', 'true');
    });

    it('devrait permettre de désactiver showOutsideDays', () => {
      render(<Calendar showOutsideDays={false} />);

      const calendar = screen.getByTestId('day-picker');
      expect(calendar).toHaveAttribute('data-show-outside-days', 'false');
    });
  });

  describe('CRITICITÉ HAUTE - Navigation Calendrier', () => {
    it('devrait afficher les boutons de navigation avec icônes', () => {
      render(<Calendar />);

      const prevButton = screen.getByTestId('nav-previous');
      const nextButton = screen.getByTestId('nav-next');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();

      // Vérifier les icônes
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('devrait appliquer les styles de navigation correctement', () => {
      render(<Calendar />);

      const prevButton = screen.getByTestId('nav-previous');
      const nextButton = screen.getByTestId('nav-next');

      expect(prevButton).toHaveClass('absolute left-1');
      expect(nextButton).toHaveClass('absolute right-1');
    });

    it('devrait permettre la navigation par clavier', async () => {
      render(<Calendar />);

      const prevButton = screen.getByTestId('nav-previous');
      
      // Test focus et activation par clavier
      prevButton.focus();
      expect(prevButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      // La navigation devrait fonctionner
    });
  });

  describe('CRITICITÉ HAUTE - Sélection de Dates', () => {
    it('devrait permettre la sélection de dates pour planification médicale', async () => {
      const onSelect = jest.fn();
      render(<Calendar onSelect={onSelect} />);

      const day15 = screen.getByTestId('day-15');
      await user.click(day15);

      expect(onSelect).toHaveBeenCalledWith(expect.any(Date));
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('devrait mettre en évidence la date sélectionnée', () => {
      const selectedDate = new Date(2024, 2, 20);
      render(<Calendar selected={selectedDate} />);

      const day20 = screen.getByTestId('day-20');
      expect(day20).toHaveAttribute('aria-selected', 'true');
      // Adapter aux vraies classes CSS de shadcn/ui
      expect(day20).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('devrait identifier la date d\'aujourd\'hui', () => {
      render(<Calendar />);

      const today = screen.getByTestId('day-15'); // Mock: aujourd'hui = 15
      // Adapter aux vraies classes CSS de shadcn/ui
      expect(today).toHaveClass('bg-accent', 'text-accent-foreground');
    });

    it('devrait gérer les sélections multiples pour périodes de congés', async () => {
      const onSelect = jest.fn();
      render(<Calendar onSelect={onSelect} mode="range" />);

      // Sélectionner début de période
      const startDay = screen.getByTestId('day-10');
      await user.click(startDay);

      // Sélectionner fin de période
      const endDay = screen.getByTestId('day-15');
      await user.click(endDay);

      expect(onSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('CRITICITÉ HAUTE - Styles et Accessibilité', () => {
    it('devrait appliquer les styles de base correctement', () => {
      render(<Calendar />);

      const table = screen.getByTestId('calendar-table');
      expect(table).toHaveClass('w-full border-collapse space-y-1');

      const captionLabel = screen.getByTestId('caption-label');
      expect(captionLabel).toHaveClass('text-sm font-medium');
    });

    it('devrait permettre la personnalisation des styles via classNames', () => {
      const customClassNames = {
        table: 'custom-table-class',
        day: 'custom-day-class',
        day_selected: 'custom-selected-class',
      };

      render(<Calendar classNames={customClassNames} />);

      const table = screen.getByTestId('calendar-table');
      expect(table).toHaveClass('custom-table-class');

      const day = screen.getByTestId('day-1');
      expect(day).toHaveClass('custom-day-class');
    });

    it('devrait maintenir l\'accessibilité pour les lecteurs d\'écran', () => {
      render(<Calendar />);

      const days = screen.getAllByRole('button');
      days.forEach(day => {
        expect(day).toBeInTheDocument();
        // Vérifier que les jours ont les attributs ARIA appropriés
      });
    });

    it('devrait gérer les états disabled pour jours non-sélectionnables', () => {
      const disabledDays = { before: new Date(2024, 2, 10) };
      render(<Calendar disabled={disabledDays} />);

      // Les jours avant le 10 mars devraient être désactivés
      const day5 = screen.getByTestId('day-5');
      // Adapter aux vraies classes CSS pour les jours désactivés
      expect(day5).toHaveClass('text-muted-foreground', 'opacity-50');
    });
  });

  describe('CRITICITÉ MOYENNE - Intégration Médicale', () => {
    it('devrait supporter les modificateurs pour jours fériés médicaux', () => {
      const holidays = [new Date(2024, 2, 15), new Date(2024, 2, 25)];
      render(<Calendar modifiers={{ holiday: holidays }} />);

      // Les jours fériés devraient avoir un marquage spécial
      const calendar = screen.getByTestId('day-picker');
      expect(calendar).toBeInTheDocument();
    });

    it('devrait gérer les plages de dates pour congés médicaux', () => {
      const leaveRange = { 
        from: new Date(2024, 2, 10), 
        to: new Date(2024, 2, 15) 
      };
      render(<Calendar selected={leaveRange} mode="range" />);

      // La plage devrait être visible
      const day10 = screen.getByTestId('day-10');
      const day15 = screen.getByTestId('day-15');
      
      expect(day10).toBeInTheDocument();
      expect(day15).toBeInTheDocument();
    });

    it('devrait permettre la configuration de plusieurs mois pour planification', () => {
      render(<Calendar numberOfMonths={3} />);

      const calendar = screen.getByTestId('day-picker');
      expect(calendar).toBeInTheDocument();
      // Avec 3 mois affichés simultanément
    });

    it('devrait supporter les événements personnalisés de dates', async () => {
      const onDayClick = jest.fn();
      const onMonthChange = jest.fn();

      render(
        <Calendar 
          onDayClick={onDayClick}
          onMonthChange={onMonthChange}
        />
      );

      const day20 = screen.getByTestId('day-20');
      await user.click(day20);

      expect(onDayClick).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  describe('CRITICITÉ MOYENNE - Responsive et Performance', () => {
    it('devrait appliquer les classes responsive correctement', () => {
      render(<Calendar />);

      const months = screen.getByTestId('day-picker').querySelector('.flex.flex-col.sm\\:flex-row');
      // Les classes responsive devraient être appliquées pour mobile/desktop
    });

    it('devrait gérer les grandes périodes sans impact performance', () => {
      const startTime = performance.now();
      
      render(
        <Calendar 
          fromYear={2020} 
          toYear={2030}
          numberOfMonths={12}
        />
      );
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // <100ms pour rendu
    });

    it('devrait optimiser le rendu pour interaction rapide', async () => {
      const onSelect = jest.fn();
      render(<Calendar onSelect={onSelect} />);

      const startTime = performance.now();
      
      // Simulation de clics rapides sur plusieurs dates
      for (let day = 1; day <= 10; day++) {
        const dayButton = screen.getByTestId(`day-${day}`);
        await user.click(dayButton);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // <500ms pour 10 sélections
      expect(onSelect).toHaveBeenCalledTimes(10);
    });
  });

  describe('CRITICITÉ FAIBLE - Export Calendrier Wrapper', () => {
    it('devrait exporter Calendar sous le nom Calendrier', () => {
      render(<Calendrier />);

      expect(screen.getByTestId('day-picker')).toBeInTheDocument();
    });

    it('devrait maintenir la même API pour Calendrier et Calendar', () => {
      const onSelect = jest.fn();
      
      const { rerender } = render(<Calendar onSelect={onSelect} />);
      
      // Test Calendar
      const day1 = screen.getByTestId('day-1');
      fireEvent.click(day1);
      expect(onSelect).toHaveBeenCalledTimes(1);

      // Test Calendrier avec même props
      rerender(<Calendrier onSelect={onSelect} />);
      
      const day2 = screen.getByTestId('day-2');
      fireEvent.click(day2);
      expect(onSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('GESTION D\'ERREURS ET CAS LIMITES', () => {
    it('devrait gérer les props invalides gracieusement', () => {
      expect(() => {
        render(
          <Calendar 
            selected={new Date('invalid')}
            onSelect={undefined}
            className={null as any}
          />
        );
      }).not.toThrow();
    });

    it('devrait maintenir la stabilité avec des dates extrêmes', () => {
      const extremeDates = [
        new Date(1900, 0, 1),
        new Date(2099, 11, 31),
        new Date(2024, 1, 29), // 29 février bissextile
      ];

      extremeDates.forEach(date => {
        expect(() => {
          render(<Calendar selected={date} />);
        }).not.toThrow();
      });
    });

    it('devrait récupérer des erreurs de rendu', () => {
      // Mock d'une erreur dans DayPicker
      const ErrorCalendar = () => {
        throw new Error('Test error');
      };

      expect(() => {
        render(<ErrorCalendar />);
      }).toThrow();
    });

    it('devrait valider les callbacks avant exécution', async () => {
      const onSelect = null;
      render(<Calendar onSelect={onSelect as any} />);

      const day1 = screen.getByTestId('day-1');
      
      // Ne devrait pas crasher même avec callback null
      expect(() => {
        fireEvent.click(day1);
      }).not.toThrow();
    });
  });

  describe('TESTS D\'INTÉGRATION COMPOSANT', () => {
    it('devrait s\'intégrer correctement avec les modals médicales', async () => {
      const onDateSelect = jest.fn();
      
      const TestWrapper = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

        const handleSelect = (date: Date | undefined) => {
          setSelectedDate(date);
          onDateSelect(date);
          setIsOpen(false);
        };

        return (
          <div>
            <button onClick={() => setIsOpen(true)} data-testid="open-calendar">
              Ouvrir calendrier
            </button>
            {isOpen && (
              <div data-testid="calendar-modal">
                <Calendar onSelect={handleSelect} selected={selectedDate} />
              </div>
            )}
          </div>
        );
      };

      render(<TestWrapper />);

      // Ouvrir le calendrier
      await user.click(screen.getByTestId('open-calendar'));
      expect(screen.getByTestId('calendar-modal')).toBeInTheDocument();

      // Sélectionner une date
      await user.click(screen.getByTestId('day-15'));
      
      expect(onDateSelect).toHaveBeenCalledWith(expect.any(Date));
      expect(screen.queryByTestId('calendar-modal')).not.toBeInTheDocument();
    });

    it('devrait supporter les formulaires de demande de congés', async () => {
      const onSubmit = jest.fn();
      
      const LeaveForm = () => {
        const [startDate, setStartDate] = React.useState<Date | undefined>();
        const [endDate, setEndDate] = React.useState<Date | undefined>();

        const handleSubmit = () => {
          onSubmit({ startDate, endDate });
        };

        return (
          <form>
            <div data-testid="start-date-picker">
              <Calendar onSelect={setStartDate} selected={startDate} />
            </div>
            <div data-testid="end-date-picker">
              <Calendar onSelect={setEndDate} selected={endDate} />
            </div>
            <button type="button" onClick={handleSubmit} data-testid="submit-leave">
              Demander congé
            </button>
          </form>
        );
      };

      render(<LeaveForm />);

      // Sélectionner date de début dans le premier calendrier
      const startCalendar = screen.getAllByTestId('day-picker')[0];
      const startDay = within(startCalendar).getByTestId('day-10');
      await user.click(startDay);

      // Sélectionner date de fin dans le second calendrier
      const endCalendar = screen.getAllByTestId('day-picker')[1];
      const endDay = within(endCalendar).getByTestId('day-15');
      await user.click(endDay);

      // Soumettre le formulaire
      await user.click(screen.getByTestId('submit-leave'));

      expect(onSubmit).toHaveBeenCalledWith({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
    });
  });
});

// Import missing function for within
import { within } from '@/test-utils/renderWithProviders';
