# 🏥 Règles de Planning Spécifiques - Équipe Anesthésistes

*Dernière mise à jour : 28 Mai 2025*

> **Documentation complète des règles métier spécifiques à l'équipe d'anesthésistes, basée sur l'analyse des besoins terrain et à implémenter dans le système de règles dynamiques V2.**

## 📋 Vue d'ensemble

Cette documentation définit les règles de planning spécifiques à l'équipe d'anesthésistes, recueillies lors de l'analyse des besoins. Ces règles doivent être **entièrement configurables** dans l'application pour permettre l'adaptation à d'autres équipes.

---

## 🌙 A. GARDES ET ASTREINTES

### A1. Structure de garde

**Configuration actuelle de l'équipe :**
```yaml
Structure:
  - 1 médecin de GARDE (activité exclusive)
  - 1 médecin d'ASTREINTE (renfort + activité normale)

Contraintes garde:
  - Garde = SEULE affectation (pas de consultation/bloc/supervision)
  - Astreinte = activité normale + disponibilité renfort

Durée:
  - Standard: 24h (8h à 8h)
  - Exception: garde coupée possible
    - Médecin A: 8h-18h ou 8h-20h
    - Médecin B: suite jusqu'à 8h lendemain
```

**Paramétrage requis dans l'app :**
- [x] **Type d'affectation "GARDE"** : exclusif, bloque autres affectations
- [x] **Type d'affectation "ASTREINTE"** : compatible avec activité normale
- [ ] **Garde coupée** : interface pour saisir horaires non-standard
- [ ] **Gardes spécialisées** : paramétrage désactivé pour équipe actuelle, configurable pour autres équipes

### A2. Contraintes temporelles gardes

**Règles équipe actuelle :**
```yaml
Fréquence:
  - Max 3 gardes/mois (temps plein)
  - Proratisation selon temps de travail
  - Exception vacances: jusqu'à 4 gardes/mois

Repos post-garde:
  - MAR ne travaille pas le lendemain
  - Fin garde 8h → reprise possible 24h plus tard (8h J+2)

Espacement gardes:
  - Idéal: 6 jours minimum
  - Exception possible si nécessaire (vacances)
  - Pénalité fatigue proportionnelle si espacement réduit
```

**Paramétrage système de règles :**
```typescript
interface GardeRules {
  maxGardesPerMonth: {
    tempsPlein: 3;
    vacation: 4; // pendant périodes vacances
    proratisation: boolean; // selon temps de travail
  };
  
  reposPostGarde: {
    dureeMinimum: 24; // heures
    jourSuivantInterdit: boolean;
  };
  
  espacementGardes: {
    ideal: 6; // jours
    minimum: 3; // jours (exception)
    penaliteFatigue: 'proportionnelle'; // si < idéal
  };
}
```

### A2bis. Weekends et jours fériés

**Spécificités équipe :**
- **Pas de règle automatique** : répartition manuelle par admin
- **Décomposition requise** pour suivi équité :
  - Weekends séparément
  - Vendredi, samedi, dimanche individuellement  
  - Jours fériés à part (Noël, Jour de l'An, etc.)

**Interface admin requise :**
- [ ] Vue séparée weekends vs jours fériés
- [ ] Compteurs individuels par type de jour
- [ ] Répartition manuelle avec aide à la décision

---

## 🏥 B. SUPERVISION BLOC OPÉRATOIRE

### B3. Secteurs et salles - Configuration actuelle

**Architecture bloc :**
```yaml
Secteurs spécialisés:
  - Ophtalmologie: 4 salles
  - Endoscopie: 4 salles
  
Secteurs standards:
  - Hyperaseptique: 4 salles
  - Intermédiaire: 3 salles  
  - Septique: 6 salles

Total: 21 salles réparties en 5 secteurs
```

**Règles d'incompatibilité :**
- **Pas d'incompatibilité entre salles** d'un même secteur
- **Incompatibilités de supervision** entre secteurs (paramétrable)

### B4. Compétences et supervision

**⚠️ SUPPRESSION** : Pas de niveaux MAR/IADE (junior/senior/expert) dans cette équipe

**Compétences spécialisées :**
```yaml
Équipe actuelle:
  - Pédiatrie: Tous pratiquent mais règles spécifiques possibles
  
Configuration future (autres équipes):
  - Chirurgie cardiaque
  - Chirurgie vasculaire  
  - Neurochirurgie
  - [Paramétrable dans l'app]
```

**Règles de supervision par secteur :**

```yaml
Standard (Hyperaseptique, Intermédiaire, Septique):
  IADE: 1 salle max (non dérogeable)
  MAR: Variable selon contexte
  
Endoscopie:
  IADE: 2 salles anesthésie max
  MAR: 2 salles anesthésie + supervision 2 salles IADE
  Exemple: MAR (Salles 1+2 + supervision 3+4) + IADE (Salles 3+4)
  
Ophtalmologie:
  1 personne: 3 salles max (MAR ou IADE)
  4 salles: répartition 2-2 (MAR supervise 2 salles IADE + 2 propres)
```

**Interface de paramétrage requise :**
- [ ] **Règles par secteur** : nombre max salles par rôle
- [ ] **Règles de supervision** : qui peut superviser qui
- [ ] **Exceptions configurables** : dérogations possibles
- [ ] **Compétences spécialisées** : CRUD avec association personnel

---

## ⚖️ C. GESTION DE LA FATIGUE/PÉNIBILITÉ

### C5. Pondération des activités

**Philosophie :** Score de pénibilité pour équilibrer la charge de travail

```yaml
Gardes:
  - 24h standard: Points de base
  - Weekend: Majoration pénibilité
  - Pas de spécialité (équipe actuelle)

Objectif principal:
  - Répartition équitable par semaine/MAR
  - Éviter surcharge supervision pour un même MAR
  - Équilibrer consultations et temps OFF
```

**Seuils d'alerte :**
- **Écart significatif** par rapport à médiane/moyenne équipe
- **Pondération temps de travail** : temps plein vs temps partiel
- **Gestion congés** : congé ≠ rattrapage automatique temps OFF

### C6. Récupération et équilibrage

**Principes :**
- **Temps partiel** : pas de pénalisation, charge proportionnelle
- **Congés dans semaine** : peut réduire temps OFF mais congé ≠ temps OFF
- **Équilibrage continu** : éviter accumulation déséquilibres

---

## 📊 D. ÉQUITÉ ET RÉPARTITION

### D7. Calcul d'équité

**Approche multi-temporelle :**
```yaml
Équité continue:
  - Suivi hebdomadaire (accepte inégalités temporaires)
  - Objectif: éviter dérives importantes
  
Équité long terme:
  - Gardes, consultations, weekends
  - Toujours rapporté au temps de travail
  - Exemple: Temps partiel 50% = 50% des gardes
```

### D8. Préférences et demandes

**Équipe actuelle : PAS de préférences personnelles**

**Système de demandes d'affectation :**
```yaml
Demandes acceptées:
  - "Je souhaite travailler tel jour"
  - "Je veux être en consultation telle demi-journée"
  
Validation:
  - Vérification impact génération planning
  - Si validé: placement obligatoire lors génération
  
Échanges collègues:
  - Autonomes entre collègues
  - Condition: affectations/nombre équivalents
  - Pas d'intervention admin requise
```

---

## 🚨 E. CONTRAINTES ET ALERTES

### E9. Gestion des périodes

**Alertes congés :**
```yaml
Vacances scolaires:
  - Alerte si >40% MAR en congé
  - Alerte si >40% IADE en congé
  - Détail: qui est déjà absent vs demandes en attente
  
Congés formation:
  - MAR: décompté congés annuels, soumis validation admin
  - IADE: sur temps travail, non décompté congés annuels
```

**Pas de contrainte saisonnière spécifique**

### E10. Cas particuliers

```yaml
Remplaçants:
  - Règles spécifiques configurables dans l'app
  - À définir selon équipe
  
Médecins formation:
  - Non applicable équipe actuelle
  
Incompatibilités personnelles:
  - Configurable par admin dans l'app
  - Par personnel, paramétrable
```

---

## 🔐 F. ADMINISTRATION ET VALIDATION

### F11. Droits et traçabilité

```yaml
Modification règles:
  - ADMIN_TOTAL uniquement
  - Validation obligatoire avant application
  - Logs de traçabilité complets
```

### F12. Flexibilité et dérogations

**Dérogations possibles :**
```yaml
Supervision:
  - Augmentation nb supervisions MAR si nécessaire
  - Condition: aucune autre possibilité
  
Alertes dérogation:
  - Résumé fin génération planning
  - Impact visuel sur affectations concernées
  - Autorisation admin requise
```

---

## 🎯 G. PRIORITÉS ET OBJECTIFS

### G13. Hiérarchie des contraintes

**Non négociables :**
1. **Temps de repos post-garde** (24h minimum)
2. **Règles de supervision sécurité**

**Importantes avec flexibilité :**
1. **Équité long terme** : suivi et prise en compte génération
2. **Éviter surcharges ponctuelles**

**Principes :**
- Équité pas parfaite mais suivie
- Congés ≠ rattrapage automatique retard
- Urgences gérées hors système
- Priorisation sécurité > confort

---

## 🛠️ IMPLÉMENTATION TECHNIQUE

### Plan d'implémentation optimisé (ordre technique)

**1. 📊 Base : Système compteurs équité** (fondation)
- [ ] Modèle de données avec compteurs ajustables admin
- [ ] Pourcentage temps travail dans profil utilisateur
- [ ] Import/remise à zéro historique plannings
- [ ] Équité multi-période : semaine (OFF) + long terme (gardes/WE)
- [ ] Arrondi au plus proche mais exacte long terme

**2. 🏥 Configuration secteurs/supervision** (règles métier)
- [ ] Interface CRUD secteurs (5 secteurs définis)
- [ ] Règles supervision paramétrable par secteur
- [ ] Alertes visuelles dérogations (rouge + popup + résumé)
- [ ] Suppression système niveaux MAR/IADE

**3. 🌙 Gardes/astreintes** (contraintes temporelles)
- [ ] Configuration 1 garde + 1 astreinte
- [ ] Gardes coupées (interface simple, équité 0.5)
- [ ] Espacement 6j, max 3/mois, repos 24h
- [ ] Proratisation selon pourcentage contrat

**4. 📝 Demandes d'affectation** (interface utilisateur)
- [ ] "Je veux consultation mardi" → affectation directe
- [ ] "Je veux travailler X" → alerte visuelle bleue
- [ ] Validation admin en cas de conflit
- [ ] Interface simple, intuitive, visuellement cohérente

### Spécifications techniques validées

**Alertes visuelles** :
- ❌ **Rouge** : Dérogation règle supervision + popup explication
- 🔵 **Bleue** : Demande utilisateur + point exclamation
- 📊 **Résumé** : Toutes alertes en bas de planning

**Équité** :
- **Base calcul** : Pourcentage théorique contrat
- **Arrondi** : Au plus proche, exact long terme
- **Période** : Multi-temporel (semaine OFF + long terme gardes)

**Gardes coupées** :
- **Interface** : Simple (2 champs horaires) - exceptionnel
- **Équité** : 0.5 garde pour chaque médecin

**Compteurs admin** :
- **Ajustables** : Modification manuelle possible
- **Import historique** : Reprise données existantes
- **Remise à zéro** : Par admin uniquement

### Tests et validation

- [ ] Tests règles équipe spécifiques
- [ ] Validation avec planning réel historique
- [ ] Interface configuration admin complète
- [ ] Export/import configurations pour autres équipes
- [ ] Tests compteurs ajustables et historique

---

*Cette documentation sera mise à jour selon l'évolution des besoins et l'implémentation technique.*