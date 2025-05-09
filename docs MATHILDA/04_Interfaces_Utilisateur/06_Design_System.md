# Design System & Charte Graphique MATHILDA

Ce document définit les éléments visuels et les composants réutilisables qui constituent l'identité graphique de l'application MATHILDA. L'objectif est d'assurer une cohérence visuelle et une expérience utilisateur homogène.

## 1. Philosophie

*   **Clarté :** Prioriser la lisibilité et la compréhension de l'information, essentielle dans un contexte médical complexe.
*   **Efficacité :** Concevoir des interfaces qui permettent aux utilisateurs d'accomplir leurs tâches rapidement et sans friction.
*   **Cohérence :** Utiliser les mêmes styles, composants et motifs d'interaction à travers toute l'application.
*   **Accessibilité :** Respecter les bonnes pratiques d'accessibilité (contrastes, navigation clavier...). *(WCAG 2.1 niveau AA visé)*

## 2. Bibliothèque de Composants UI

Nous utiliserons [Chakra UI](https://chakra-ui.com/) comme bibliothèque de base pour les composants React. Les avantages incluent :

*   Composants accessibles et composables.
*   Système de theming puissant.
*   Bonne documentation et communauté active.

Les composants spécifiques à MATHILDA (ex: cellule de planning, carte de demande de congé) seront construits en utilisant ou en étendant les composants Chakra UI.

*(Optionnel: Utiliser [Storybook](https://storybook.js.org/) pour documenter et visualiser les composants de manière isolée.)*

## 3. Palette de Couleurs

La palette doit être professionnelle, claire et permettre une bonne différentiation visuelle.

*   **Couleurs Primaires :**
    *   `Bleu Principal` (Liens, boutons primaires, éléments actifs) : `#3182CE` (Chakra: `blue.500`)
    *   `Bleu Foncé` (Texte sur fond clair, titres) : `#2A4365` (Chakra: `blue.800`)
*   **Couleurs Secondaires :**
    *   `Gris Clair` (Fonds, bordures) : `#E2E8F0` (Chakra: `gray.200`)
    *   `Gris Moyen` (Texte secondaire, icônes) : `#718096` (Chakra: `gray.500`)
    *   `Gris Foncé` (Texte principal) : `#2D3748` (Chakra: `gray.700`)
*   **Couleurs Sémantiques (Feedback) :**
    *   `Vert Succès` (Validation, confirmation) : `#38A169` (Chakra: `green.500`)
    *   `Rouge Erreur` (Erreur, suppression) : `#E53E3E` (Chakra: `red.500`)
    *   `Orange Avertissement` (Attention, attente) : `#DD6B20` (Chakra: `orange.500`)
    *   `Bleu Information` (Info, notes) : `#3182CE` (Chakra: `blue.500`)
*   **Couleurs pour Types d'Affectation (Exemples) :**
    *   Bloc Standard : `blue.100`
    *   Garde : `red.100`
    *   Astreinte : `orange.100`
    *   Formation : `purple.100`
    *   Congé / Indisponibilité : `gray.100`
    *(Ces couleurs seront configurables dans le panneau d'administration)*

## 4. Typographie

Choisir une police lisible et professionnelle.

*   **Police Principale (UI & Texte) :** [Inter](https://fonts.google.com/specimen/Inter) ou une police système standard (ex: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
*   **Tailles de Police (Basées sur Chakra UI) :**
    *   Titres (h1, h2, h3) : `2xl`, `xl`, `lg`
    *   Texte normal : `md`
    *   Texte secondaire / petit : `sm`
*   **Graisses :** Utiliser `normal` (400) et `semibold` (600) ou `bold` (700).

## 5. Espacements et Grilles

Utiliser le système d'espacement basé sur des multiples de 4px ou 8px fourni par Chakra UI.

*   `space.1` = 4px
*   `space.2` = 8px
*   `space.3` = 12px
*   `space.4` = 16px
*   ...
*   Utiliser les composants `Box`, `Flex`, `Grid`, `Stack` de Chakra UI pour gérer les layouts.

## 6. Iconographie

Utiliser une bibliothèque d'icônes cohérente.

*   **Bibliothèque Recommandée :** [React Icons](https://react-icons.github.io/react-icons/) (qui inclut FontAwesome, Material Icons, etc.) ou les icônes fournies par Chakra UI (`@chakra-ui/icons`).
*   **Style :** Préférer un style sobre et clair (ex: outline).
*   **Utilisation :** Utiliser les icônes pour renforcer la compréhension, pas seulement pour la décoration. Associer systématiquement un texte alternatif ou un `aria-label` pour l'accessibilité.

## 7. Composants Spécifiques MATHILDA (Exemples)

*   **`PlanningCell` :** Affiche une affectation dans la grille. Gère les couleurs, les informations de base, les indicateurs visuels.
*   **`AssignmentDetailCard` :** Affiche les détails complets d'une affectation dans une modal ou un panneau latéral.
*   **`LeaveRequestCard` :** Affiche un résumé d'une demande de congé dans une liste.
*   **`ConfigTreeNode` :** Représente un élément (Site, Secteur, Salle) dans l'arborescence de configuration, gère le glisser-déposer.
*   **`UserCounterDisplay` :** Affiche les compteurs d'équité d'un utilisateur.

*(Ces composants seront à développer et potentiellement à documenter dans Storybook.)*

## 8. Thème Chakra UI

Un fichier de thème personnalisé (`src/styles/theme.ts` dans le frontend) sera créé pour surcharger les valeurs par défaut de Chakra UI avec notre palette de couleurs, typographie, et styles de composants spécifiques.

```typescript
// Exemple simplifié de theme.ts
import { extendTheme } from '@chakra-ui/react'

const colors = {
  brand: {
    primary: '#3182CE',
    // ... autres couleurs
  },
}

const fonts = {
  heading: `'Inter', sans-serif`,
  body: `'Inter', sans-serif`,
}

const theme = extendTheme({
  colors,
  fonts,
  // ... autres surcharges (styles de boutons, etc.)
})

export default theme
``` 