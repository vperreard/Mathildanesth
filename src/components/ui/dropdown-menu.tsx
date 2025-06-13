'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '../../lib/logger';
import { cn } from '@/lib/utils';

export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  const closeMenuCallback = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={cn('relative inline-block text-left', className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as React.ReactElement<DropdownMenuTriggerProps>, {
              onToggle: toggleMenu,
            });
          }
          if (child.type === DropdownMenuContent) {
            return React.cloneElement(child as React.ReactElement<DropdownMenuContentProps>, {
              isOpen,
              closeMenu: closeMenuCallback,
            });
          }
        }
        return child;
      })}
    </div>
  );
};

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
  onToggle?: () => void;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  asChild,
  className,
  onToggle,
}) => {
  const handleClick = (event: React.MouseEvent) => {
    onToggle?.();
  };

  if (asChild && React.isValidElement(children)) {
    const childOnClick = children.props.onClick;
    return React.cloneElement(children as React.ReactElement<any>, {
      ...children.props,
      onClick: (e: React.MouseEvent) => {
        handleClick(e);
        if (childOnClick) {
          childOnClick(e);
        }
      },
      className: cn(children.props.className, className),
    });
  }

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md p-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
  isOpen?: boolean;
  closeMenu?: () => void;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = 'end',
  className,
  isOpen,
  closeMenu,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node) && isOpen) {
        logger.info('[DropdownMenuContent] Click outside detected. Closing menu.');
        closeMenu?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeMenu, ref]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/10 focus:outline-none dark:bg-slate-800 dark:ring-white/10',
        {
          'right-0': align === 'end',
          'left-0': align === 'start',
          'left-1/2 transform -translate-x-1/2': align === 'center',
        },
        className
      )}
    >
      <div className="py-1">
        {React.Children.map(children, item => {
          if (React.isValidElement(item) && item.type === DropdownMenuItem) {
            return React.cloneElement(item as React.ReactElement<DropdownMenuItemProps>, {
              onItemActionComplete: closeMenu,
            });
          }
          return item;
        })}
      </div>
    </div>
  );
};

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  onItemActionComplete?: () => void;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onClick,
  className,
  disabled = false,
  onItemActionComplete,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    logger.info('[DropdownMenuItem] handleClick');

    try {
      if (onClick) {
        await onClick(event);
      }
      logger.info(
        '[DropdownMenuItem] Action complete, calling onItemActionComplete to close menu.'
      );
      onItemActionComplete?.();
    } finally {
      // Reset après un délai pour éviter les double-clics
      setTimeout(() => setIsProcessing(false), 300);
    }
  };
  return (
    <button
      type="button"
      className={cn(
        'block w-full text-left px-4 py-2 text-sm',
        disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-900 hover:bg-gray-100 hover:text-gray-900',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export interface DropdownMenuSeparatorProps {
  className?: string;
}

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ className }) => {
  return <div className={cn('h-px my-1 bg-gray-200', className)} role="separator" />;
};

export interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </div>
  );
};

// Sub-menu components
export interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuSubTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onToggle: () => setIsOpen(!isOpen),
              isOpen,
            });
          }
          if (child.type === DropdownMenuSubContent) {
            return React.cloneElement(child as React.ReactElement<any>, { isOpen });
          }
        }
        return child;
      })}
    </div>
  );
};

export interface DropdownMenuSubTriggerProps {
  children: React.ReactNode;
  className?: string;
  onToggle?: () => void;
  isOpen?: boolean;
}

export const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({
  children,
  className,
  onToggle,
  isOpen,
}) => {
  return (
    <button
      type="button"
      className={cn(
        'block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-between',
        className
      )}
      onClick={onToggle}
    >
      {children}
      <svg
        className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-90')}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

export interface DropdownMenuPortalProps {
  children: React.ReactNode;
}

export const DropdownMenuPortal: React.FC<DropdownMenuPortalProps> = ({ children }) => {
  // For now, render inline. Can be enhanced to use React Portal if needed
  return <>{children}</>;
};

export interface DropdownMenuSubContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

export const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({
  children,
  className,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute left-full top-0 ml-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/10 focus:outline-none dark:bg-slate-800 dark:ring-white/10',
        className
      )}
    >
      <div className="py-1">{children}</div>
    </div>
  );
};

// Radio Group components
export interface DropdownMenuRadioGroupProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const DropdownMenuRadioGroup: React.FC<DropdownMenuRadioGroupProps> = ({
  children,
  value,
  onValueChange,
}) => {
  return (
    <div role="radiogroup">
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === DropdownMenuRadioItem) {
          return React.cloneElement(child as React.ReactElement<DropdownMenuRadioItemProps>, {
            checked: value === child.props.value,
            onSelect: () => onValueChange?.(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
};

export interface DropdownMenuRadioItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  checked?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

export const DropdownMenuRadioItem: React.FC<DropdownMenuRadioItemProps> = ({
  children,
  value,
  className,
  checked = false,
  onSelect,
  disabled = false,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      onSelect?.();
    }
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      className={cn(
        'relative flex w-full items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
        disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-900 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && (
          <svg className="h-2 w-2 fill-current" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
};

export default DropdownMenu;
