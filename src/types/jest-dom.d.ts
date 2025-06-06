/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
    namespace jest {
        interface Matchers<R> {
            // Les matchers de @testing-library/jest-dom
            toBeInTheDocument(): R;
            toBeVisible(): R;
            toBeChecked(): R;
            toHaveValue(value: string): R;
            toHaveTextContent(text: string | RegExp): R;
            toHaveAttribute(attr: string, value?: string): R;
            toHaveClass(...classNames: string[]): R;
            toHaveStyle(style: string | Record<string, unknown>): R;
            toBeDisabled(): R;
            toBeEnabled(): R;
            toBeRequired(): R;
            toBeValid(): R;
            toBeInvalid(): R;
            toHaveFocus(): R;
            toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
            // Ajouter d'autres matchers au besoin

            // Matchers Jest standards qui semblent manquer
            toHaveBeenCalled(): R;
            toHaveBeenCalledWith(...args: unknown[]): R;
            toHaveBeenLastCalledWith(...args: unknown[]): R;
        }
    }

    namespace global {
        namespace jest {
            interface Expect {
                objectContaining<T>(object: T): T;
                any(constructor: unknown): unknown;
            }
        }
    }
}

// Cette exportation vide est nécessaire pour faire de ce fichier un module ES plutôt qu'un script global
export { }; 