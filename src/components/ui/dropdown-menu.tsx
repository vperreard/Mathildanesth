"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface DropdownMenuProps {
    children: React.ReactNode;
    className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
    children,
    className
}) => {
    return (
        <div className={cn("relative inline-block text-left", className)}>
            {children}
        </div>
    );
};

export interface DropdownMenuTriggerProps {
    children: React.ReactNode;
    asChild?: boolean;
    className?: string;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
    children,
    asChild,
    className
}) => {
    return (
        <div className={cn("inline-flex", className)}>
            {asChild ? (
                children
            ) : (
                <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                >
                    {children}
                </button>
            )}
        </div>
    );
};

export interface DropdownMenuContentProps {
    children: React.ReactNode;
    align?: "start" | "end" | "center";
    className?: string;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
    children,
    align = "end",
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const toggleMenu = () => setIsOpen(!isOpen);

        // Trouver le bouton déclencheur qui est le frère précédent
        const triggerEl = ref.current?.previousElementSibling;

        if (triggerEl) {
            triggerEl.addEventListener("click", toggleMenu);

            return () => {
                triggerEl.removeEventListener("click", toggleMenu);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
                {
                    "right-0": align === "end",
                    "left-0": align === "start",
                    "left-1/2 transform -translate-x-1/2": align === "center",
                },
                className
            )}
        >
            <div className="py-1">{children}</div>
        </div>
    );
};

export interface DropdownMenuItemProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
    children,
    onClick,
    className,
    disabled = false
}) => {
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
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default DropdownMenu; 