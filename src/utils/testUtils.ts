/**
 * Utilitaires pour les tests
 *
 * Ces fonctions aident à préparer nos composants pour les tests automatisés,
 * notamment en facilitant l'ajout d'attributs data-cy pour Cypress.
 */

/**
 * Type pour les props data-cy
 */
export type DataCyProps = {
  'data-cy'?: string;
};

/**
 * Ajoute un attribut data-cy à un élément React
 *
 * @param id - Identifiant à utiliser pour l'attribut data-cy
 * @param props - Props existantes du composant
 * @returns Props avec l'attribut data-cy ajouté
 *
 * @example
 * ```tsx
 * // Dans un composant React
 * const Button = ({ children, ...props }) => (
 *   <button {...props} {...dataCy('submit-button')}>
 *     {children}
 *   </button>
 * );
 * ```
 */
export const dataCy = (id: string): DataCyProps => ({
  'data-cy': id,
});

/**
 * Combine un identifiant data-cy avec un préfixe
 * Utile pour les composants qui ont besoin d'un espace de noms
 *
 * @param prefix - Préfixe pour l'attribut data-cy
 * @param id - Identifiant à utiliser pour l'attribut data-cy
 * @returns Chaîne combinée au format "prefix-id"
 *
 * @example
 * ```tsx
 * // Dans un composant React
 * const DataTable = ({ rows, namespace = 'data-table' }) => (
 *   <table {...dataCy(namespace)}>
 *     {rows.map((row, index) => (
 *       <tr key={index} {...dataCy(prefixDataCy(namespace, `row-${index}`))}>
 *         ...
 *       </tr>
 *     ))}
 *   </table>
 * );
 * ```
 */
export const prefixDataCy = (prefix: string, id: string): string => {
  return `${prefix}-${id}`;
};

/**
 * Ajoute automatiquement un préfixe data-cy à un élément
 *
 * @param prefix - Préfixe pour l'attribut data-cy
 * @param id - Identifiant à utiliser pour l'attribut data-cy
 * @returns Props avec l'attribut data-cy préfixé
 *
 * @example
 * ```tsx
 * // Dans un composant React
 * const Form = ({ fields }) => (
 *   <form {...dataCy('user-form')}>
 *     {fields.map((field, index) => (
 *       <input
 *         key={field.name}
 *         {...field}
 *         {...dataCyWithPrefix('user-form', `field-${field.name}`)}
 *       />
 *     ))}
 *   </form>
 * );
 * ```
 */
export const dataCyWithPrefix = (prefix: string, id: string): DataCyProps => {
  return dataCy(prefixDataCy(prefix, id));
};

/**
 * Extrait les props data-cy d'un objet de props
 * Utile pour les composants HOC qui passent des props à leurs enfants
 *
 * @param props - Props du composant
 * @returns Un objet contenant l'attribut data-cy s'il existe
 *
 * @example
 * ```tsx
 * // Dans un composant HOC
 * const withTheme = (Component) => {
 *   return (props) => {
 *     const dataCyProps = extractDataCyProps(props);
 *     return <Component {...props} {...dataCyProps} />;
 *   };
 * };
 * ```
 */
export const extractDataCyProps = (props: Record<string, unknown>): DataCyProps => {
  const { 'data-cy': dataCy } = props;
  return dataCy ? { 'data-cy': dataCy } : {};
};
