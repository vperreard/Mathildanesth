# Maquettes des Écrans Principaux

## 1. Structure Générale

### 1.1 Layout Principal
```
+------------------+--------------------------------------------+
|     Header       |            Barre de Notifications          |
+------------------+--------------------------------------------+
|                  |                                            |
|    Navigation    |                                            |
|    Latérale      |            Zone de Contenu                 |
|                  |                                            |
|                  |                                            |
+------------------+--------------------------------------------+
```

## 2. Écran Planning Principal

### 2.1 Vue Hebdomadaire
```
+----------------+------------------------------------------------+
| Filtres & Vue  |  L   |  M   |  M   |  J   |  V   |  S   |  D  |
+----------------+------+------+------+------+------+------+------+
| Secteur 1      |      |      |      |      |      |      |      |
| - Salle 1      | MAR1 | MAR2 | MAR1 | MAR3 | MAR2 |  -   |  -  |
| - Salle 2      | IADE1| IADE2| IADE1| IADE3| IADE2|  -   |  -  |
+----------------+------+------+------+------+------+------+------+
| Secteur 2      |      |      |      |      |      |      |      |
| - Salle 3      | MAR3 | MAR1 | MAR2 | MAR1 | MAR3 |  -   |  -  |
| - Salle 4      | IADE3| IADE1| IADE2| IADE1| IADE3|  -   |  -  |
+----------------+------+------+------+------+------+------+------+
```

### 2.2 Composants Interactifs
- Barre d'outils flottante pour les actions rapides
- Menu contextuel sur clic droit
- Drag & drop pour les modifications
- Tooltips détaillés sur survol

## 3. Dashboard Personnel

### 3.1 Layout Dashboard
```
+-------------------+-------------------+
|   Mes Prochaines  |    Compteurs     |
|   Affectations    |    & Métriques   |
+-------------------+-------------------+
|   Notifications   |    Demandes en   |
|     & Alertes     |     Attente      |
+-------------------+-------------------+
|   Planning de     |    Notes &       |
|     la Semaine    |    Messages      |
+-------------------+-------------------+
```

## 4. Interface Administration

### 4.1 Configuration des Secteurs
```
+------------------------+----------------------+
|  Liste des Secteurs    |  Détails Secteur    |
|  [Drag & Drop Zone]    |  - Nom              |
|  - Secteur 1          |  - Description      |
|  - Secteur 2          |  - Salles           |
|  - Secteur 3          |  - Règles           |
+------------------------+----------------------+
```

### 4.2 Gestion des Utilisateurs
```
+------------------------+----------------------+
|  Filtres & Recherche   |  Actions Groupées   |
+------------------------+----------------------+
|  Liste des Utilisateurs                      |
|  - Nom, Rôle, Statut                        |
|  - Actions rapides par utilisateur           |
+------------------------+----------------------+
```

## 5. Modales et Popups

### 5.1 Création/Modification d'Affectation
```
+----------------------------------------+
|  Titre Modal                [X]         |
+----------------------------------------+
|  Personnel : [Dropdown]                 |
|  Date : [DatePicker]                   |
|  Créneau : [TimePicker]                |
|  Type : [Dropdown]                      |
|  Notes : [TextArea]                     |
+----------------------------------------+
|  [Annuler]              [Confirmer]    |
+----------------------------------------+
```

### 5.2 Notifications
```
+----------------------------------------+
|  🔔 Nouvelle notification              |
|  Message court et explicite            |
|  [Action] [Ignorer]                    |
+----------------------------------------+
```

## 6. Version Mobile

### 6.1 Navigation Mobile
```
+----------------------------------------+
|  🏠 👤 📅 🔔                           |
+----------------------------------------+
|                                        |
|           Contenu Principal            |
|                                        |
+----------------------------------------+
|           Menu Navigation              |
+----------------------------------------+
```

### 6.2 Planning Mobile
- Vue journalière par défaut
- Swipe horizontal pour changer de jour
- Vue condensée des informations
- Actions principales accessibles via boutons flottants 