# Guide Utilisateur - Module de Planning Mathildanesth

## Table des matières

1. [Introduction](#introduction)
2. [Génération automatique de planning](#génération-automatique-de-planning)
3. [Validation et ajustements](#validation-et-ajustements)
4. [Gestion des remplacements](#gestion-des-remplacements)
5. [Système de trames](#système-de-trames)
6. [Indicateurs et métriques](#indicateurs-et-métriques)
7. [FAQ et dépannage](#faq-et-dépannage)

## Introduction

Le module de planning de Mathildanesth est conçu pour simplifier et optimiser la gestion des plannings hospitaliers. Il combine génération automatique intelligente, validation manuelle intuitive et gestion flexible des remplacements.

### Fonctionnalités principales

- **Génération automatique** avec respect des contraintes légales et préférences
- **Validation visuelle** avec drag & drop
- **Remplacement rapide** en 3 clics
- **Système de trames** pour les plannings récurrents
- **Score de qualité** en temps réel

## Génération automatique de planning

### Accès à la génération

1. Naviguer vers **Planning** > **Génération**
2. Sélectionner la période (mois, trimestre)
3. Choisir le site/service
4. Cliquer sur **Générer le planning**

### Paramètres de génération

#### Contraintes obligatoires (automatiques)
- ✅ Repos minimum entre gardes (48h)
- ✅ Maximum de gardes consécutives (2)
- ✅ Respect des congés validés
- ✅ Compétences requises par poste

#### Options personnalisables

**Distribution équitable**
```
☑️ Répartir équitablement les gardes
☑️ Équilibrer weekends et jours fériés
☑️ Alterner les types de postes
```

**Préférences du personnel**
```
☑️ Respecter les souhaits (si possible)
☑️ Éviter les incompatibilités
☑️ Prioriser l'ancienneté
```

**Optimisation de la fatigue**
```
☑️ Limiter la charge hebdomadaire
☑️ Espacer les gardes difficiles
☑️ Équilibrer jour/nuit
```

### Processus de génération

1. **Analyse des ressources**
   - Personnel disponible
   - Absences prévues
   - Compétences requises

2. **Application des contraintes**
   - Règles légales
   - Règles du service
   - Préférences individuelles

3. **Optimisation**
   - Équité de distribution
   - Minimisation de la fatigue
   - Maximisation de la satisfaction

4. **Score de qualité**
   - Équité : 85/100
   - Fatigue : 90/100
   - Contraintes : 100/100
   - **Score global : 91/100**

## Validation et ajustements

### Interface de validation

La vue calendrier permet de visualiser et ajuster le planning généré :

```
┌─────────────────────────────────────────────────────────┐
│ Planning Janvier 2024 - Service Anesthésie              │
├─────────┬────┬────┬────┬────┬────┬────┬────┬──────────┤
│         │ Lun│ Mar│ Mer│ Jeu│ Ven│ Sam│ Dim│ Actions  │
├─────────┼────┼────┼────┼────┼────┼────┼────┼──────────┤
│ Semaine │    │    │    │    │    │    │    │          │
│ 1       │ JD │ MM │ PL │ JD │ MM │ PL │ JD │ ✓ Valider│
│         │ G  │ G  │ G  │ A  │ A  │ G  │ G  │          │
├─────────┼────┼────┼────┼────┼────┼────┼────┼──────────┤
│ Légende │ G: Garde | A: Astreinte | C: Consultation    │
└─────────────────────────────────────────────────────────┘
```

### Indicateurs visuels

- 🟢 **Vert** : Affectation optimale
- 🟡 **Jaune** : Avertissement (fatigue, préférence non respectée)
- 🔴 **Rouge** : Conflit ou contrainte non respectée
- ⚠️ **Triangle** : Modification manuelle recommandée

### Drag & Drop

Pour modifier une affectation :

1. **Cliquer** sur l'affectation à déplacer
2. **Glisser** vers la nouvelle date/personne
3. **Déposer** - Le système vérifie automatiquement la validité

**Raccourcis clavier :**
- `Ctrl + Z` : Annuler la dernière modification
- `Ctrl + S` : Sauvegarder les modifications
- `Espace` : Voir les détails de l'affectation

### Validation par période

- **Jour par jour** : Validation précise avec vérification détaillée
- **Par semaine** : Validation rapide avec vue d'ensemble
- **Mois complet** : Validation globale après ajustements

### Export du planning

Une fois validé, le planning peut être exporté :

- **PDF** : Pour affichage et impression
- **Excel** : Pour intégration RH
- **iCal** : Pour synchronisation calendriers

## Gestion des remplacements

### Remplacement d'urgence

En cas d'absence imprévue :

1. Cliquer sur l'affectation concernée
2. Sélectionner **"Trouver un remplaçant"**
3. Le système propose automatiquement les meilleurs candidats

### Critères de sélection

Les remplaçants sont classés selon :

1. **Disponibilité** (pas d'autre affectation)
2. **Compétences** (qualification pour le poste)
3. **Charge de travail** (équité)
4. **Proximité** (déjà sur site)
5. **Historique** (fiabilité des remplacements)

### Interface de remplacement

```
┌─────────────────────────────────────────────┐
│ Remplacement rapide - Garde du 15/01/2024  │
├─────────────────────────────────────────────┤
│ Absent : Jean Dupont (Maladie)              │
│ Poste : Garde MAR - Bloc A                  │
├─────────────────────────────────────────────┤
│ Remplaçants disponibles :                   │
│                                             │
│ ⭐ Marie Martin (Score: 95/100)            │
│    ✓ Disponible ✓ Qualifiée ✓ 3 gardes    │
│    [Contacter] [Affecter]                   │
│                                             │
│ ⭐ Paul Durand (Score: 87/100)             │
│    ✓ Disponible ✓ Qualifié ⚠️ 5 gardes    │
│    [Contacter] [Affecter]                   │
└─────────────────────────────────────────────┘
```

### Notifications automatiques

Lors d'un remplacement :
- 📱 SMS au remplaçant sélectionné
- 📧 Email de confirmation
- 📅 Mise à jour automatique des plannings
- 📊 Ajustement des compteurs

## Système de trames

### Qu'est-ce qu'une trame ?

Une trame est un modèle de planning réutilisable qui définit :
- Les affectations récurrentes (bloc, consultations)
- Le personnel habituel
- Les périodes d'application

### Création d'une trame

1. **Accéder aux trames** : Paramètres > Trames
2. **Nouvelle trame** : Cliquer sur "+"
3. **Configurer** :
   ```
   Nom : "Bloc Principal Semaine Type"
   Récurrence : Hebdomadaire
   Jours actifs : Lun-Ven
   Période : 01/01/2024 au 31/12/2024
   ```

4. **Définir les affectations** :
   ```
   Lundi Matin : Chirurgie générale - Dr Martin
   Lundi AM : Orthopédie - Dr Durand
   Mardi Matin : ORL - Dr Petit
   ...
   ```

### Application des trames

Les trames sont automatiquement appliquées lors de la génération :

1. Le système identifie les trames actives
2. Applique les affectations définies
3. Complète avec les gardes et astreintes
4. Optimise l'ensemble

### Gestion des exceptions

Pour une semaine spécifique :
- Désactiver temporairement la trame
- Modifier manuellement les affectations
- Créer une trame exceptionnelle

## Indicateurs et métriques

### Dashboard temps réel

Le tableau de bord affiche :

- **Taux de couverture** : 98% des postes pourvus
- **Score d'équité** : 85/100
- **Charge moyenne** : 42h/semaine
- **Satisfaction** : 4.2/5

### Métriques détaillées

#### Par personne
- Nombre de gardes/mois
- Weekends travaillés
- Score de fatigue
- Préférences respectées

#### Par service
- Couverture des postes
- Répartition des charges
- Coût des remplacements
- Incidents

### Alertes automatiques

- 🔴 **Critique** : Poste non couvert
- 🟡 **Important** : Fatigue excessive détectée
- 🔵 **Information** : Planning à valider

## FAQ et dépannage

### Questions fréquentes

**Q: Le planning généré ne respecte pas une préférence**
> R: Les préférences sont respectées dans la mesure du possible. Les contraintes légales et la couverture des postes sont prioritaires.

**Q: Comment modifier une affectation validée ?**
> R: Cliquer sur le cadenas 🔒 pour déverrouiller la période, effectuer les modifications, puis revalider.

**Q: Un remplaçant refuse, que faire ?**
> R: Le système propose automatiquement le candidat suivant. Vous pouvez aussi rechercher manuellement.

**Q: Comment gérer les mi-temps ?**
> R: Configurer le pattern de travail dans le profil utilisateur (ex: Lun-Mer uniquement).

### Résolution de problèmes

#### "Impossible de générer le planning"

1. Vérifier le personnel disponible
2. Contrôler les contraintes (trop restrictives ?)
3. Augmenter la période (plus de flexibilité)
4. Contacter le support si persistant

#### "Performances dégradées"

1. Réduire la période de génération
2. Désactiver temporairement l'optimisation
3. Vider le cache navigateur
4. Utiliser Chrome/Edge pour de meilleures performances

#### "Conflits de planning"

1. Identifier le conflit (indicateur rouge)
2. Voir les détails (clic sur l'alerte)
3. Résoudre manuellement ou régénérer
4. Valider la correction

### Support

Pour toute assistance :
- 📧 support@mathildanesth.fr
- 📞 01 23 45 67 89
- 💬 Chat intégré (9h-18h)

### Raccourcis utiles

| Action | Raccourci |
|--------|-----------|
| Générer planning | `Ctrl + G` |
| Valider sélection | `Ctrl + V` |
| Rechercher remplaçant | `Ctrl + R` |
| Exporter PDF | `Ctrl + P` |
| Aide contextuelle | `F1` |

---

*Version 2.0 - Dernière mise à jour : Janvier 2025*