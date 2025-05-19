// Ajoute les types de @testing-library/jest-dom aux types Jest globaux
import '@testing-library/jest-dom';

declare global {
    namespace jest {
        interface Matchers<R> {
            // Les matchers de @testing-library/jest-dom
            toBeInTheDocument(): R;
            toBeVisible(): R;
            toBeChecked(): R;
            toHaveValue(value: any): R;
            toHaveAttribute(attr: string, value?: any): R;
            toHaveClass(...classNames: string[]): R;
            toHaveTextContent(text: string | RegExp): R;
            toContainElement(element: HTMLElement | null): R;
            toHaveProperty(keyPath: string, value?: any): R;
            // Ajouter d'autres matchers au besoin

            // Matchers Jest standards qui semblent manquer
            toHaveBeenCalled(): R;
            toHaveBeenCalledWith(...args: any[]): R;
            toHaveBeenLastCalledWith(...args: any[]): R;
        }
    }

    namespace global {
        namespace jest {
            interface Expect {
                objectContaining<T>(object: T): T;
                any(constructor: any): any;
            }
        }
    }
}

// Cette exportation vide est nécessaire pour faire de ce fichier un module ES plutôt qu'un script global
export { }; 