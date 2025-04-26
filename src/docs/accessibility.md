# Guide d'Accessibilité - Mathildanesth

Ce document décrit les améliorations d'accessibilité apportées aux composants UI de l'application Mathildanesth. Il sert de guide aux développeurs pour maintenir et améliorer l'accessibilité de l'application.

## Principes généraux d'accessibilité

Tous les composants doivent respecter les principes WCAG (Web Content Accessibility Guidelines) 2.1 niveau AA :

1. **Perceptible** - L'information et les composants de l'interface utilisateur doivent être présentés aux utilisateurs de manière à ce qu'ils puissent les percevoir.
2. **Utilisable** - Les composants de l'interface utilisateur et la navigation doivent être utilisables.
3. **Compréhensible** - L'information et l'utilisation de l'interface utilisateur doivent être compréhensibles.
4. **Robuste** - Le contenu doit être suffisamment robuste pour être interprété de manière fiable par une grande variété d'agents utilisateurs, y compris les technologies d'assistance.

## Composants UI Améliorés

### Button

Les boutons ont été améliorés pour offrir une meilleure accessibilité :

- Attributs ARIA appropriés (`aria-pressed`, `aria-busy`, `aria-disabled`)
- Focus visible et contrasté 
- Messages d'état pour les lecteurs d'écran
- Support des états de chargement
- Gestion des raccourcis clavier

```tsx
// Exemple d'utilisation
<Button 
  aria-label="Ajouter un utilisateur" 
  isLoading={isSubmitting}
  disabled={!isValid}
>
  Ajouter
</Button>
```

### Input

Les champs de formulaire ont été améliorés :

- Labels explicites et associés (`htmlFor` et `id` correspondants)
- Messages d'erreur liés au champ via `aria-describedby`
- Indication des champs obligatoires (`aria-required="true"`)
- État de validité du champ (`aria-invalid`)
- Focus visible et contrasté
- Support des descriptions et instructions

```tsx
// Exemple d'utilisation
<div>
  <label id="name-label" htmlFor="name">Nom</label>
  <Input 
    id="name" 
    aria-labelledby="name-label"
    aria-required="true"
    aria-invalid={hasError('name')}
    aria-describedby={hasError('name') ? 'name-error' : undefined}
  />
  {hasError('name') && (
    <div id="name-error" className="error">
      {getErrorMessage('name')}
    </div>
  )}
</div>
```

### Dialog

Les dialogues modaux sont maintenant plus accessibles :

- Attribut `role="dialog"` ou `role="alertdialog"`
- Attribut `aria-modal="true"`
- Attribut `aria-labelledby` pointant vers le titre
- Gestion du focus : focus piégé dans la modale
- Support de la fermeture par Échap
- Retour au focus à l'élément déclencheur
- Contraste suffisant pour les overlays

```tsx
// Exemple d'utilisation
<Dialog 
  isOpen={isOpen} 
  onClose={closeDialog}
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">Titre du dialogue</h2>
  <p>Contenu du dialogue...</p>
  <Button onClick={closeDialog}>Fermer</Button>
</Dialog>
```

### Switch

Les interrupteurs ont été améliorés :

- Utilisation de `role="switch"` 
- Attribut `aria-checked` pour indiquer l'état
- Support de la navigation clavier (espace pour basculer)
- États visuels clairs (ON/OFF)
- Labels explicites associés via `aria-labelledby`

```tsx
// Exemple d'utilisation
<div>
  <span id="notifications-label">Activer les notifications</span>
  <Switch 
    checked={notificationsEnabled}
    onChange={toggleNotifications}
    role="switch"
    aria-checked={notificationsEnabled}
    aria-labelledby="notifications-label"
  />
</div>
```

### Badge

Les badges ont été améliorés :

- Utilisation de `role="status"` pour les badges dynamiques
- Contraste suffisant pour la lisibilité
- Support des états de suppression
- Gestion du focus pour les badges interactifs

```tsx
// Exemple d'utilisation
<Badge role="status" count={5} aria-label="5 notifications non lues" />
```

### Table

Les tableaux ont été améliorés :

- Structure sémantique (`<thead>`, `<tbody>`, `<th>`)
- En-têtes de tableau avec `scope="col"` ou `scope="row"`
- Support du tri avec `aria-sort`
- Navigation clavier améliorée
- Captions et résumés pour les tableaux complexes

```tsx
// Exemple d'utilisation
<Table aria-label="Liste des utilisateurs">
  <caption>Liste des utilisateurs enregistrés dans le système</caption>
  <thead>
    <tr>
      <th scope="col" aria-sort="ascending">Nom</th>
      <th scope="col">Email</th>
      <th scope="col">Rôle</th>
    </tr>
  </thead>
  <tbody>
    {/* Lignes du tableau */}
  </tbody>
</Table>
```

### Card

Les cartes ont été améliorées :

- Structure sémantique (titres appropriés)
- Support du focus et de la navigation clavier
- Contraste suffisant entre le contenu et l'arrière-plan
- Utilisation de `aria-labelledby` pour associer les titres

```tsx
// Exemple d'utilisation
<Card>
  <h3 id="card-title">Titre de la carte</h3>
  <p id="card-description">Description de la carte...</p>
  <Button aria-labelledby="card-title card-description">Voir plus</Button>
</Card>
```

## Composants principaux

### Header

Le composant Header a été amélioré :

- Ajout de `role="banner"` pour indiquer qu'il s'agit de l'en-tête principal
- Navigation avec `role="navigation"` et `aria-label`
- Support des attributs d'état comme `aria-current="page"`
- Amélioration de la navigation au clavier
- Menus déroulants accessibles

### Navigation

Le composant Navigation a été amélioré :

- Ajout d'attributs `aria-current="page"` pour indiquer la page active
- Menu mobile avec `aria-expanded` et `aria-controls`
- Focus visible sur les éléments de navigation
- Gestion appropriée des états de hover et focus

### UserProfile

Le composant UserProfile a été amélioré :

- Menu déroulant avec `role="menu"` et items avec `role="menuitem"`
- Support des états (`aria-expanded`) 
- Fermeture du menu avec la touche Échap
- Gestion du focus dans le menu

### LoginForm

Le composant LoginForm a été amélioré :

- Messages d'erreur associés aux champs avec `aria-describedby`
- État des champs avec `aria-invalid` et `aria-required`
- État de chargement avec `aria-busy` et `aria-disabled`
- Feedback visuel et auditif pour les erreurs

## Tests d'accessibilité

Pour tester l'accessibilité des composants :

1. **Outils automatisés** : Utiliser Jest Axe pour les tests automatisés
2. **Lecteurs d'écran** : Tester avec VoiceOver (macOS), NVDA (Windows)
3. **Navigation clavier** : Vérifier que tous les éléments interactifs sont accessibles au clavier
4. **Contraste** : Utiliser des outils comme Contrast Checker pour vérifier les ratios de contraste

## Prochaines étapes

Les améliorations futures pourront inclure :

1. Ajout de tests d'accessibilité automatisés dans la CI/CD
2. Développement d'une suite de tests end-to-end pour l'accessibilité
3. Audit d'accessibilité complet
4. Formation des développeurs aux bonnes pratiques d'accessibilité

---

Dernière mise à jour : Avril 2025 