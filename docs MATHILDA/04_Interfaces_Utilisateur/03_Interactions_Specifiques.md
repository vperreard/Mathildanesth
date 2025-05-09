# Interactions Spécifiques et Fonctionnalités Avancées

## 1. Vue Planning Principal

### 1.1 Interactions Rapides
```
+--------------------------------------------------+
|  [Vue: Jour][Vue: Semaine][Vue: Mois] [Aujourd'hui]
|  << Précédent    Semaine 23 (5-11 Juin)    Suivant >>
+--------------------------------------------------+
|  🔍 Recherche | 👤 Filtres | ⚡️ Actions Rapides  |
+--------------------------------------------------+
```

### 1.2 Actions Contextuelles
- **Survol d'une Affectation :**
  ```
  +--------------------------------+
  | Dr. Martin - Salle 1           |
  | 8h00 - 13h00                   |
  | Supervise : IADE1 (Salle 2)    |
  | 🔄 Modifier | ❌ Supprimer     |
  +--------------------------------+
  ```

- **Menu Contextuel (Clic Droit) :**
  ```
  +--------------------------------+
  | ✏️ Modifier l'affectation      |
  | 🔄 Échanger avec...            |
  | 📋 Copier vers...              |
  | ❌ Supprimer                    |
  | 📝 Ajouter une note            |
  +--------------------------------+
  ```

## 2. Tableaux de Bord Personnalisés

### 2.1 Widget Compteurs
```
+----------------------------------------+
|  Mes Compteurs                    [⚙️]  |
+----------------------------------------+
| Gardes ce mois : 3/4    [===========] |
| Astreintes : 2/5        [=====      ] |
| Weekends : 1/2          [======     ] |
+----------------------------------------+
```

### 2.2 Widget Notes Rapides
```
+----------------------------------------+
|  Notes du Jour                    [+]  |
+----------------------------------------+
| 📌 Réunion équipe 14h                 |
| 🚨 Salle 3 maintenance 15h-17h        |
| ℹ️ Formation nouveaux internes         |
+----------------------------------------+
```

## 3. Fonctionnalités Avancées

### 3.1 Système de Glisser-Déposer
- **Indicateurs Visuels :**
  ```
  +----------------+
  | Zone Valide    |
  | ✅ Compatible  |
  +----------------+

  +----------------+
  | Zone Invalide  |
  | ❌ Conflit     |
  +----------------+
  ```

### 3.2 Système de Notifications
- **Notification Empilée :**
  ```
  +----------------------------------------+
  | 🔔 3 nouvelles notifications           |
  |----------------------------------------|
  | ⚡️ Modification planning urgent        |
  | 📝 2 demandes d'échange en attente     |
  +----------------------------------------+
  ```

### 3.3 Assistant de Planification
```
+----------------------------------------+
| Assistant de Planification        [?]   |
+----------------------------------------+
| 1. Sélection période     [Fait ✓]      |
| 2. Import trame         [En cours ⟳]   |
| 3. Validation règles    [À faire ○]    |
| 4. Génération          [À faire ○]     |
+----------------------------------------+
```

## 4. Modes d'Affichage Spécialisés

### 4.1 Mode Supervision
```
+----------------------------------------+
| Vue Supervision - Secteur 1            |
|----------------------------------------|
| MAR1 → IADE1 (S1), IADE2 (S2)         |
| MAR2 → IADE3 (S3)                     |
| MAR3 → ∅                              |
+----------------------------------------+
```

### 4.2 Mode Comparaison
```
+----------------------------------------+
| Comparaison Plannings                   |
|----------------------------------------|
| Semaine 23     | Version 1 | Version 2 |
| Salle 1 - Lun  | MAR1      | MAR2     |
| Salle 1 - Mar  | MAR2      | MAR2     |
| [Différences surlignées en jaune]      |
+----------------------------------------+
```

## 5. Raccourcis et Gestes

### 5.1 Raccourcis Clavier
- **Navigation Rapide :**
  ```
  +----------------------------------------+
  | [⌘ + ←] Jour précédent                |
  | [⌘ + →] Jour suivant                  |
  | [⌘ + ↑] Vue plus large                |
  | [⌘ + ↓] Vue plus détaillée            |
  | [⌘ + F] Recherche rapide              |
  +----------------------------------------+
  ```

### 5.2 Gestes Tactiles (Mobile/Tablette)
- **Interactions Tactiles :**
  ```
  +----------------------------------------+
  | Pincer = Zoom planning                 |
  | Glisser = Déplacer affectation        |
  | Double tap = Détails affectation      |
  | Swipe gauche/droite = Changer de jour |
  +----------------------------------------+
  ```

## 6. États et Retours Visuels

### 6.1 États d'Affectation
```
+----------------------------------------+
| Normal     | Fond blanc, bordure bleue  |
| Modifié    | Bordure orange pointillée  |
| Conflit    | Fond rouge clair          |
| Incomplet  | Fond gris hachuré         |
| Validé     | Badge vert ✓              |
+----------------------------------------+
```

### 6.2 Indicateurs de Charge
```
+----------------------------------------+
| Charge de travail journalière          |
|----------------------------------------|
| 0-4h    : ⚪️ Normal                   |
| 4-8h    : 🟡 Attention                |
| 8h+     : 🔴 Surcharge                |
+----------------------------------------+
``` 