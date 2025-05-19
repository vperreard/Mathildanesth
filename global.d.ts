/// <reference types="@testing-library/jest-dom" />

// Extension globale des types Jest
interface JestMatchers<R> {
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toBeChecked(): R;
    toHaveValue(value: any): R;
    toHaveTextContent(text: string | RegExp): R;
    toContainElement(element: HTMLElement | null): R;
    toHaveProperty(keyPath: string, value?: any): R;

    // Jest standards
    toHaveBeenCalled(): R;
    toHaveBeenCalledWith(...args: any[]): R;
    toHaveBeenLastCalledWith(...args: any[]): R;
}

// ExpectStatic helpers
interface ExpectStatic {
    objectContaining<T>(object: T): T;
    any(constructor: any): any;
} 