"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface DropdownMenuProps {
    children: React.ReactNode;
    className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
    children,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = useCallback(() => {
        console.log('[DropdownMenu] toggleMenu called, current isOpen:', isOpen, '->', !isOpen);
        setIsOpen(prev => !prev);
    }, [isOpen]);
    const closeMenuCallback = useCallback(() => {
        console.log('[DropdownMenu] closeMenuCallback called. Setting isOpen to false.');
        setIsOpen(false);
    }, []);

    return (
        <div className={cn("relative inline-block text-left", className)}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    if (child.type === DropdownMenuTrigger) {
                        return React.cloneElement(child as React.ReactElement<DropdownMenuTriggerProps>, { onToggle: toggleMenu });
                    }
                    if (child.type === DropdownMenuContent) {
                        return React.cloneElement(child as React.ReactElement<DropdownMenuContentProps>, { isOpen, closeMenu: closeMenuCallback });
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
    onToggle
}) => {
    const handleClick = (event: React.MouseEvent) => {
        console.log('[DropdownMenuTrigger] handleClick. Calling onToggle.');
        onToggle?.();
    };

    if (asChild && React.isValidElement(children)) {
        const childOnClick = children.props.onClick;
        console.log('[DropdownMenuTrigger] asChild=true, cloning child:', children.type);
        return React.cloneElement(children as React.ReactElement<any>, {
            ...children.props,
            onClick: (e: React.MouseEvent) => {
                console.log('[DropdownMenuTrigger] Child (cloned) onClick fired.');
                handleClick(e);
                if (childOnClick) {
                    console.log('[DropdownMenuTrigger] Calling original child onClick.');
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
                "inline-flex items-center justify-center rounded-md p-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
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
    align?: "start" | "end" | "center";
    className?: string;
    isOpen?: boolean;
    closeMenu?: () => void;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
    children,
    align = "end",
    className,
    isOpen,
    closeMenu
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node) && isOpen) {
                console.log('[DropdownMenuContent] Click outside detected. Closing menu.');
                closeMenu?.();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, closeMenu, ref]);

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-10 mt-2 w-56 rounded-md bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-black/10 focus:outline-none dark:bg-slate-800/95 dark:ring-white/10",
                {
                    "right-0": align === "end",
                    "left-0": align === "start",
                    "left-1/2 transform -translate-x-1/2": align === "center",
                },
                className
            )}
        >
            <div className="py-1">
                {React.Children.map(children, item => {
                    if (React.isValidElement(item) && item.type === DropdownMenuItem) {
                        return React.cloneElement(item as React.ReactElement<DropdownMenuItemProps>, { onItemActionComplete: closeMenu });
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
    onItemActionComplete
}) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        console.log('[DropdownMenuItem] handleClick');
        if (onClick) {
            onClick(event);
        }
        console.log('[DropdownMenuItem] Action complete, calling onItemActionComplete to close menu.');
        onItemActionComplete?.();
    };
    return (
        <button
            type="button"
            className={cn(
                "block w-full text-left px-4 py-2 text-sm",
                disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
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

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({
    className
}) => {
    return (
        <div 
            className={cn("h-px my-1 bg-gray-200", className)}
            role="separator"
        />
    );
};

export interface DropdownMenuLabelProps {
    children: React.ReactNode;
    className?: string;
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({
    children,
    className
}) => {
    return (
        <div 
            className={cn(
                "px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider",
                className
            )}
        >
            {children}
        </div>
    );
};

export default DropdownMenu; 