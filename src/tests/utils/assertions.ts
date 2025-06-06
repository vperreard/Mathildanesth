/**
 * Utilitaires d'assertion pour contourner les problèmes de typage Jest
 */

// Type générique pour les fonctions mock
export type MockFn = jest.Mock | any;

/**
 * Vérifie qu'un élément est présent dans le document
 */
export function expectToBeInDocument(element: HTMLElement | null | undefined): void {
    expect(element).toBeInTheDocument();
}

/**
 * Vérifie qu'un élément n'est pas présent dans le document
 */
export function expectNotToBeInDocument(element: HTMLElement | null | undefined): void {
    expect(element).not.toBeInTheDocument();
}

/**
 * Vérifie qu'un élément est visible
 */
export function expectToBeVisible(element: HTMLElement | null | undefined): void {
    expect(element).toBeVisible();
}

/**
 * Vérifie qu'une fonction mock a été appelée
 */
export function expectToHaveBeenCalled(mockFn: MockFn): void {
    expect(mockFn).toHaveBeenCalled();
}

/**
 * Vérifie qu'une fonction mock n'a pas été appelée
 */
export function expectNotToHaveBeenCalled(mockFn: MockFn): void {
    expect(mockFn).not.toHaveBeenCalled();
}

/**
 * Vérifie qu'une fonction mock a été appelée avec des arguments spécifiques
 */
export function expectToHaveBeenCalledWith(mockFn: MockFn, ...args: unknown[]): void {
    expect(mockFn).toHaveBeenCalledWith(...args);
}

/**
 * Vérifie qu'une fonction mock a été appelée un nombre spécifique de fois
 */
export function expectToHaveBeenCalledTimes(mockFn: MockFn, times: number): void {
    expect(mockFn).toHaveBeenCalledTimes(times);
}

/**
 * Vérifie qu'un élément a une valeur spécifique
 */
export function expectToHaveValue(element: HTMLElement | null | undefined, value: string): void {
    expect(element).toHaveValue(value);
}

/**
 * Vérifie qu'un élément a un texte spécifique
 */
export function expectToHaveTextContent(element: HTMLElement | null | undefined, text: string | RegExp): void {
    expect(element).toHaveTextContent(text);
}

/**
 * Vérifie qu'une case à cocher est cochée
 */
export function expectToBeChecked(element: HTMLElement | null | undefined): void {
    expect(element).toBeChecked();
}

/**
 * Vérifie qu'une valeur est undefined
 */
export function expectToBeUndefined(value: unknown): void {
    expect(value).toBeUndefined();
}

/**
 * Vérifie qu'une valeur est null
 */
export function expectToBeNull(value: unknown): void {
    expect(value).toBeNull();
}

/**
 * Vérifie qu'une valeur est définie
 */
export function expectToBeDefined(value: unknown): void {
    expect(value).toBeDefined();
}

/**
 * Vérifie qu'une valeur est égale à une autre
 */
export function expectToBe(value: unknown, expected: unknown): void {
    expect(value).toBe(expected);
}

/**
 * Vérifie qu'une valeur est égale à une autre
 */
export function expectToEqual(value: unknown, expected: unknown): void {
    expect(value).toEqual(expected);
}

/**
 * Vérifie qu'un tableau contient tous les éléments d'un autre tableau
 */
export function expectArrayContaining(value: unknown[], expected: unknown[]): void {
    expect(value).toEqual(expect.arrayContaining(expected));
}

/**
 * Crée un objet matcher qui vérifie si une valeur contient les propriétés spécifiées
 */
export function objectContaining<T>(obj: T): T {
    return expect.objectContaining(obj);
}

/**
 * Crée un objet matcher qui accepte n'importe quelle valeur du type spécifié
 */
export function anyValue(constructor: unknown): any {
    return expect.any(constructor);
}

/**
 * Vérifie si un objet a une propriété spécifique
 */
export function expectToHaveProperty(obj: unknown, property: string, value?: unknown): void {
    if (value !== undefined) {
        expect(obj).toHaveProperty(property, value);
    } else {
        expect(obj).toHaveProperty(property);
    }
}

/**
 * Vérifie si un objet n'a pas une propriété spécifique ou si la propriété est undefined
 */
export function expectNotToHaveProperty(obj: unknown, property: string): void {
    if (property in obj && obj[property] === undefined) {
        expectToBeUndefined(obj[property]);
    } else {
        expect(obj).not.toHaveProperty(property);
    }
} 