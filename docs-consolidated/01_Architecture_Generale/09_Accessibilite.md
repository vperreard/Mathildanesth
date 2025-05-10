# Accessibilité (a11y) dans Mathildanesth

## Introduction

L'accessibilité web (souvent abrégée en a11y, car il y a 11 lettres entre le "a" et le "y") consiste à concevoir et développer des sites et applications web de manière à ce que les personnes en situation de handicap puissent les utiliser. Pour Mathildanesth, cela signifie s'assurer que l'interface est utilisable par le plus grand nombre, y compris ceux ayant des handicaps visuels, auditifs, moteurs, ou cognitifs.
La roadmap mentionne des vérifications et corrections d'accessibilité (WCAG) et des tests avec `cypress-axe` et `pa11y`.

## Principes et Standards

- **WCAG (Web Content Accessibility Guidelines) :** L'objectif est de suivre les recommandations des WCAG, idéalement le niveau AA, qui est une norme reconnue internationalement.
  Les WCAG sont organisées autour de quatre principes fondamentaux (POUR) :
  1.  **Perceptible :** Les informations et les composants de l'interface utilisateur doivent être présentables aux utilisateurs de manière à ce qu'ils puissent les percevoir.
  2.  **Utilisable (Opérable) :** Les composants de l'interface utilisateur et la navigation doivent être utilisables.
  3.  **Compréhensible :** Les informations et l'utilisation de l'interface utilisateur doivent être compréhensibles.
  4.  **Robuste :** Le contenu doit être suffisamment robuste pour être interprété de manière fiable par une grande variété d'agents utilisateurs, y compris les technologies d'assistance.

## Aspects Clés de l'Accessibilité à Implémenter

### 1. Structure Sémantique HTML

- Utiliser les éléments HTML5 sémantiques de manière appropriée (`<main>`, `<nav>`, `<article>`, `<aside>`, `<header>`, `<footer>`, `<button>`, etc.).
- Utiliser correctement les niveaux de titres (`<h1>` à `<h6>`) pour structurer le contenu de la page.
- S'assurer que les listes (`<ul>`, `<ol>`, `<dl>`) sont utilisées pour les contenus listés.

### 2. Accessibilité au Clavier

- **Navigation au Clavier :** Toutes les fonctionnalités interactives (liens, boutons, champs de formulaire, menus) doivent être accessibles et utilisables uniquement avec le clavier.
  - L'ordre de tabulation doit être logique et suivre l'ordre visuel.
  - L'élément ayant le focus doit être clairement visible (outline de focus personnalisé si besoin, mais ne jamais le supprimer sans alternative).
- **Raccourcis Clavier :** Pour les applications complexes comme un outil de planning, des raccourcis clavier bien pensés peuvent améliorer l'efficacité pour tous les utilisateurs, y compris ceux utilisant des technologies d'assistance.

### 3. Contraste des Couleurs

- S'assurer que le contraste entre le texte et son arrière-plan est suffisant (au moins 4.5:1 pour le texte normal, 3:1 pour le grand texte, selon WCAG AA).
- Idem pour les éléments graphiques importants de l'interface.
- Utiliser des outils pour vérifier les contrastes (ex: extensions de navigateur, analyseurs en ligne).

### 4. Texte Alternatif pour les Images

- Fournir un texte alternatif descriptif (attribut `alt`) pour toutes les images informatives.
- Pour les images purement décoratives, utiliser un attribut `alt` vide (`alt=""`).

### 5. Formulaires Accessibles

- Associer correctement les étiquettes (`<label>`) à leurs champs de formulaire (`<input>`, `<textarea>`, `<select>`) en utilisant l'attribut `for` ou en englobant le champ dans le label.
- Indiquer clairement les champs obligatoires.
- Fournir des messages d'erreur clairs et accessibles lorsque la validation échoue.
- Regrouper les champs de formulaire liés avec `<fieldset>` et `<legend>`.

### 6. WAI-ARIA (Accessible Rich Internet Applications)

- Utiliser les rôles, états et propriétés ARIA lorsque la sémantique HTML native n'est pas suffisante pour décrire le rôle ou l'état d'un composant complexe (ex: menus déroulants, onglets, modales, sliders, composants de calendrier).
- Les composants de Shadcn/ui, basés sur Radix UI, intègrent déjà de bonnes pratiques ARIA.
- Attention à ne pas abuser d'ARIA (la première règle d'ARIA est de ne pas utiliser ARIA si un élément HTML natif fait l'affaire).

### 7. Contenu Dynamique et Mises à Jour

- Pour les mises à jour de contenu dynamique (ex: résultats de recherche, notifications, erreurs), utiliser des régions live ARIA (`aria-live`, `aria-relevant`, `aria-atomic`) pour informer les utilisateurs de lecteurs d'écran des changements.
- Gérer correctement le focus lors de l'apparition de modales ou de changements de vue importants.

### 8. Responsive Design et Zoom

- L'application doit être responsive et rester utilisable lorsque le texte est zoomé jusqu'à 200% sans perte de contenu ou de fonctionnalité.
- Éviter de bloquer le zoom ou de définir une largeur maximale restrictive.

### 9. Internationalisation (i18n) et Accessibilité

- S'assurer que la langue de la page est correctement déclarée (`<html lang="fr">`).
- Tenir compte des changements de direction de lecture pour les langues qui se lisent de droite à gauche (RTL) si supportées à l'avenir.

## Tests d'Accessibilité

Une approche multi-niveaux pour les tests est recommandée :

1.  **Tests Automatisés :**

    - **Linters d'Accessibilité :** Intégrer des linters comme `eslint-plugin-jsx-a11y` dans le processus de développement.
    - **Outils d'Analyse Statique et Dynamique :**
      - `axe-core` : Moteur d'accessibilité qui peut être utilisé dans divers contextes.
      - `@axe-core/react` : Pour tester les composants React en développement.
      - `cypress-axe` : Intègre les tests axe dans les tests E2E Cypress. (Mentionné dans la roadmap)
      - `pa11y` : Outil en ligne de commande pour lancer des tests d'accessibilité sur des URLs. (Mentionné dans la roadmap)
    - Ces outils peuvent détecter de nombreux problèmes courants, mais pas tous.

2.  **Tests Manuels :**

    - **Navigation au Clavier :** Tester systématiquement l'application en utilisant uniquement le clavier.
    - **Utilisation avec des Lecteurs d'Écran :** Tester les parcours utilisateurs clés avec des lecteurs d'écran populaires (NVDA, VoiceOver, JAWS).
    - **Vérification des Contrastes.**
    - **Zoom du Navigateur.**

3.  **Tests Utilisateurs avec des Personnes en Situation de Handicap :**
    - C'est le moyen le plus efficace de découvrir des problèmes d'accessibilité réels et d'obtenir des retours précieux.

## Ressources et Outils

- [WCAG 2.1/2.2](https://www.w3.org/TR/WCAG21/)
- [MDN Web Docs - Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11Y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/) (contrast checker, WAVE tool)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (intégré dans les outils de développement Chrome, inclut un audit d'accessibilité)

## Intégration dans le Processus de Développement

- **Sensibilisation et Formation :** S'assurer que l'équipe de développement est consciente des enjeux de l'accessibilité et formée aux bonnes pratiques.
- **Dès la Conception :** Penser à l'accessibilité dès les phases de conception UX/UI.
- **Checklists d'Accessibilité :** Utiliser des checklists lors du développement et des revues de code.
- **Partie Intégrante des Critères d'Acceptation :** L'accessibilité doit faire partie des critères de "fini" pour une fonctionnalité.

## Conclusion

L'engagement envers l'accessibilité garantit que Mathildanesth est une application inclusive, utilisable par tous les membres de l'équipe, quelles que soient leurs capacités. C'est un effort continu qui nécessite attention, tests réguliers et une volonté d'amélioration constante.
