# Internationalisation (i18n) dans Mathildanesth

## Introduction

L'internationalisation (souvent abrégée en i18n) est le processus de conception d'une application logicielle de manière à ce qu'elle puisse être adaptée à différentes langues et régions sans modifications techniques majeures. Pour Mathildanesth, cela signifie principalement la traduction de l'interface utilisateur en français et potentiellement d'autres langues à l'avenir.

## Approche et Outils

- **Bibliothèque :** `next-intl` est la bibliothèque choisie pour gérer l'i18n dans Mathildanesth.
  - Elle est spécifiquement conçue pour Next.js et s'intègre bien avec l'App Router.
  - Elle permet de charger les traductions pour la locale actuelle et de les rendre disponibles via des hooks ou des fonctions.
- **Locales Supportées :**
  - Français (`fr`) : Langue principale et par défaut.
  - Anglais (`en`) : Potentiellement comme seconde langue pour une plus large accessibilité ou pour des contributeurs non francophones au projet.
  - D'autres locales pourront être ajoutées ultérieurement.
- **Stockage des Traductions :**
  - Les messages traduits sont stockés dans des fichiers JSON (ou JS/TS exportant un objet).
  - Structure typique : un fichier par locale dans un répertoire dédié, par exemple `messages/fr.json`, `messages/en.json` ou `src/locales/fr.json`, `src/locales/en.json`.
  - Les clés de traduction sont imbriquées pour organiser les messages par contexte ou par module (ex: `"navigation.planning": "Planning"`, `"leaves.requestForm.submitButton": "Soumettre la demande"`).

## Implémentation avec `next-intl`

Le `README.md` du projet et la documentation de `next-intl` détaillent généralement les étapes d'intégration. Voici un aperçu typique :

1.  **Configuration :**

    - Installer `next-intl`.
    - Configurer les locales supportées et la locale par défaut dans `next.config.js` ou un fichier de configuration dédié à i18n.
    - Mettre en place un middleware (`src/middleware.ts` ou `src/i18n.ts` selon la version de `next-intl`) pour détecter la locale de l'utilisateur (depuis l'URL, les cookies, ou les préférences du navigateur) et la gérer pour le routage.

2.  **Fourniture des Messages :**

    - Dans le layout racine (`src/app/[locale]/layout.tsx`), utiliser `<NextIntlClientProvider>` pour rendre les messages de la locale active disponibles aux composants clients.
    - Les Server Components peuvent accéder aux messages directement via des fonctions fournies par `next-intl` (ex: `getTranslator`).

3.  **Utilisation dans les Composants :**

    - **Composants Clients :** Utiliser le hook `useTranslations` pour accéder aux fonctions de traduction.

      ```typescript
      // Exemple dans un composant client
      import { useTranslations } from 'next-intl';

      export default function MyComponent() {
        const t = useTranslations('MyComponentMessages'); // 'MyComponentMessages' est une clé de haut niveau dans le JSON
        return <p>{t('greeting')}</p>; // Recherche la clé 'greeting' sous 'MyComponentMessages'
      }
      ```

    - **Server Components :**

      ```typescript
      // Exemple dans un Server Component
      import { getTranslator } from 'next-intl/server';

      export default async function MyServerComponent({ params: { locale } }: { params: { locale: string } }) {
        const t = await getTranslator(locale, 'MyComponentMessages');
        return <p>{t('greeting')}</p>;
      }
      ```

4.  **Traduction de Contenu Dynamique et Pluralisation :**

    - `next-intl` supporte l'interpolation de variables dans les messages.
      - `"Bienvenue, {userName} !"` -> `t('welcomeMessage', { userName: 'Alice' })`
    - Gestion de la pluralisation.
      - `{count, plural, =0 {aucun message} one {# message} other {# messages}}`
    - Formatage des dates, nombres, et devises en fonction de la locale (peut nécessiter l'intégration avec `Intl` API du navigateur ou des bibliothèques comme `date-fns` avec support des locales).

5.  **Routage Internationalisé :**
    - `next-intl` aide à configurer le routage pour inclure la locale dans l'URL (ex: `/fr/planning`, `/en/planning`) ou utiliser des domaines/sous-domaines par langue.
    - Fournit des composants comme `<Link>` qui gèrent automatiquement la locale.

## Processus de Traduction

- **Identification des Textes à Traduire :** Tous les textes visibles par l'utilisateur dans l'interface doivent être extraits et placés dans les fichiers de messages avec des clés appropriées.
- **Traducteurs :** Les traductions sont effectuées par des personnes maîtrisant les langues cibles et comprenant le contexte de l'application.
- **Outils d'Aide à la Traduction (Optionnel) :** Pour les projets plus grands, des plateformes de gestion de traductions (ex: Crowdin, Phrase, Lokalise) peuvent être utilisées pour faciliter le processus collaboratif de traduction et de validation.
- **Mise à Jour des Traductions :** Un processus doit être en place pour identifier les nouvelles chaînes à traduire lorsque de nouvelles fonctionnalités sont ajoutées ou lorsque des textes existants sont modifiés.

## Tests

- Tester l'affichage correct des traductions pour les différentes locales supportées.
- Vérifier le bon fonctionnement du routage internationalisé.
- S'assurer que le formatage des dates, nombres, etc., est correct pour chaque locale.

## Bonnes Pratiques

- **Clés de Traduction Sémantiques :** Utiliser des clés qui décrivent le sens du message plutôt que de copier le texte lui-même. Cela facilite la maintenance si le texte original change.
  - Préférer `userProfile.editButtonLabel` à `editUserProfile`.
- **Éviter de Concaténer des Chaînes Traduites :** Préférer des phrases complètes dans les fichiers de messages pour permettre une meilleure adaptation grammaticale dans les différentes langues.
- **Contexte pour les Traducteurs :** Fournir du contexte aux traducteurs (captures d'écran, descriptions de l'emplacement du texte) pour assurer la qualité de la traduction.
- **Tester avec des Textes de Longueur Variable :** S'assurer que l'interface s'adapte bien à des traductions qui peuvent être plus longues ou plus courtes que le texte original.

## Conclusion

L'implémentation de l'i18n avec `next-intl` permet à Mathildanesth d'être accessible à un public plus large et de fournir une expérience utilisateur adaptée à différentes langues. Une gestion rigoureuse des fichiers de traduction et un processus clair pour les mises à jour sont essentiels pour maintenir la qualité des traductions au fil du temps.
