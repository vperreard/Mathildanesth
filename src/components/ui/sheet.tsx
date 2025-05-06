// Composant factice pour débloquer le build
// TODO: Implémenter ou installer le vrai composant Sheet

import React from 'react';

export const Sheet = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SheetContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SheetDescription = ({ children }: { children: React.ReactNode }) => <p>{children}</p>;
export const SheetHeader = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SheetTitle = ({ children }: { children: React.ReactNode }) => <h4>{children}</h4>;
export const SheetTrigger = ({ children }: { children: React.ReactNode }) => <button>{children}</button>; 