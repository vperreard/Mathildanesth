// Étendre les types jest-dom
import '@testing-library/jest-dom';

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveClass(className: string): R;
            toBeChecked(): R;
            toBeDisabled(): R;
            toBeEnabled(): R;
            toBeEmpty(): R;
            toBeEmptyDOMElement(): R;
            toBeInvalid(): R;
            toBeRequired(): R;
            toBeValid(): R;
            toBeVisible(): R;
            toContainElement(element: HTMLElement | null): R;
            toContainHTML(htmlText: string): R;
            toHaveAttribute(attr: string, value?: string): R;
            toHaveDescription(text: string | RegExp): R;
            toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
            toHaveFocus(): R;
            toHaveFormValues(values: { [name: string]: any }): R;
            toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
            toHaveValue(value: string | string[] | number): R;
            toBeRequired(): R;
            toBePartiallyChecked(): R;
            toHaveStyle(css: string | Record<string, any>): R;
            // Ajouter toHaveBeenCalledTimes, etc. pour les mocks
            toHaveBeenCalledTimes(number: number): R;
            toHaveBeenCalledWith(...args: any[]): R;
            toHaveBeenLastCalledWith(...args: any[]): R;
            toHaveBeenNthCalledWith(nth: number, ...args: any[]): R;
            // Ajouter d'autres matchers si nécessaire
            toBeGreaterThan(number: number): R;
            toBeGreaterThanOrEqual(number: number): R;
            toBeLessThan(number: number): R;
            toBeLessThanOrEqual(number: number): R;
        }
    }
}

// Évite les erreurs "TS2669: Augmentations for the global scope can only be directly nested in external modules or ambient module declarations."
export { }; 