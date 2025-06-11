/**
 * Menu contextuel au clic-droit pour les affectations de trames
 * Permet des actions rapides sans passer par des modals
 */

import React, { useEffect, useRef } from 'react';
import { ChevronRight, Plus, User, Copy, Trash2, Calendar, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  submenu?: ContextMenuItem[];
  separator?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  items: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose, items }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {items.map((item, index) => (
        <ContextMenuItemComponent
          key={index}
          item={item}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

interface ContextMenuItemProps {
  item: ContextMenuItem;
  onClose: () => void;
}

const ContextMenuItemComponent: React.FC<ContextMenuItemProps> = ({ item, onClose }) => {
  const [showSubmenu, setShowSubmenu] = React.useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  if (item.separator) {
    return <div className="my-1 h-px bg-muted" />;
  }

  const handleClick = () => {
    if (item.action && !item.submenu) {
      item.action();
      onClose();
    }
  };

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={() => item.submenu && setShowSubmenu(true)}
      onMouseLeave={() => item.submenu && setShowSubmenu(false)}
    >
      <div
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
          item.disabled
            ? "text-muted-foreground opacity-50"
            : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          item.submenu && "pr-8"
        )}
        onClick={handleClick}
        role="menuitem"
        aria-disabled={item.disabled}
      >
        {item.icon && (
          <span className="mr-2 h-4 w-4">{item.icon}</span>
        )}
        <span className="flex-1">{item.label}</span>
        {item.submenu && (
          <ChevronRight className="absolute right-2 h-4 w-4" />
        )}
      </div>

      {item.submenu && showSubmenu && (
        <div
          className="absolute left-full top-0 ml-1 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {item.submenu.map((subItem, index) => (
            <ContextMenuItemComponent
              key={index}
              item={subItem}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper pour créer la structure du menu pour les affectations
export const createAffectationContextMenu = (
  cellInfo: {
    roomId: string;
    dayOfWeek: number;
    period: 'MORNING' | 'AFTERNOON' | 'FULL_DAY';
    hasAffectation: boolean;
    affectationId?: string;
  },
  handlers: {
    onAddAffectation: (period: 'MORNING' | 'AFTERNOON' | 'FULL_DAY' | 'GUARD') => void;
    onAssignUser: (userId: string) => void;
    onCopy: () => void;
    onPaste: () => void;
    onDelete: () => void;
    onApplyToRow: () => void;
    onApplyToColumn: () => void;
    onDuplicate: () => void;
  },
  users: Array<{ id: string; name: string; specialty?: string }>,
  canPaste: boolean
): ContextMenuItem[] => {
  const items: ContextMenuItem[] = [];

  // Ajouter affectation
  if (!cellInfo.hasAffectation) {
    items.push({
      label: 'Ajouter affectation',
      icon: <Plus className="h-4 w-4" />,
      submenu: [
        {
          label: 'Matin',
          icon: <Clock className="h-4 w-4" />,
          action: () => handlers.onAddAffectation('MORNING'),
        },
        {
          label: 'Après-midi',
          icon: <Clock className="h-4 w-4" />,
          action: () => handlers.onAddAffectation('AFTERNOON'),
        },
        {
          label: 'Journée complète',
          icon: <Calendar className="h-4 w-4" />,
          action: () => handlers.onAddAffectation('FULL_DAY'),
        },
        {
          label: '24h (garde/astreinte)',
          icon: <Clock className="h-4 w-4" />,
          action: () => handlers.onAddAffectation('GUARD'),
        },
      ],
    });
  }

  // Affecter un utilisateur
  const usersBySpecialty = users.reduce((acc, user) => {
    const specialty = user.specialty || 'Autres';
    if (!acc[specialty]) acc[specialty] = [];
    acc[specialty].push(user);
    return acc;
  }, {} as Record<string, typeof users>);

  items.push({
    label: 'Affecter chirurgien',
    icon: <User className="h-4 w-4" />,
    submenu: Object.entries(usersBySpecialty).map(([specialty, specialtyUsers]) => ({
      label: specialty,
      icon: <Users className="h-4 w-4" />,
      submenu: specialtyUsers.map(user => ({
        label: user.name,
        action: () => handlers.onAssignUser(user.id),
      })),
    })),
  });

  items.push({ separator: true });

  // Actions sur l'affectation existante
  if (cellInfo.hasAffectation) {
    items.push({
      label: 'Copier',
      icon: <Copy className="h-4 w-4" />,
      action: handlers.onCopy,
    });

    items.push({
      label: 'Dupliquer',
      icon: <Copy className="h-4 w-4" />,
      action: handlers.onDuplicate,
    });
  }

  items.push({
    label: 'Coller',
    icon: <Copy className="h-4 w-4" />,
    action: handlers.onPaste,
    disabled: !canPaste,
  });

  if (cellInfo.hasAffectation) {
    items.push({
      label: 'Supprimer',
      icon: <Trash2 className="h-4 w-4" />,
      action: handlers.onDelete,
    });
  }

  items.push({ separator: true });

  // Actions de masse
  items.push({
    label: 'Appliquer à toute la ligne',
    icon: <Calendar className="h-4 w-4" />,
    action: handlers.onApplyToRow,
    disabled: !cellInfo.hasAffectation,
  });

  items.push({
    label: 'Appliquer à toute la colonne',
    icon: <Calendar className="h-4 w-4" />,
    action: handlers.onApplyToColumn,
    disabled: !cellInfo.hasAffectation,
  });

  return items;
};