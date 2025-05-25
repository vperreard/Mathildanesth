# Axes d'Amélioration pour la Gestion des Disponibilités et Planification

Ce document présente les axes d'amélioration identifiés pour optimiser la gestion des disponibilités du personnel et rendre le système de planification plus intuitif et efficace, tant pour les utilisateurs standards que pour les administrateurs.

## 1. Améliorations pour l'Utilisateur Lambda (MAR, IADE, chirurgien)

### 1.1. Expression des Préférences

**Objectif** : Permettre aux utilisateurs d'exprimer plus facilement des préférences ponctuelles au-delà des contraintes fixes.

**Mise en œuvre** :
- Développement d'une interface dédiée où les utilisateurs peuvent :
  - Indiquer des jours préférés/évités pour certaines activités
  - Exprimer des préférences de collaboration (collègues avec qui travailler)
  - Définir des contraintes temporaires (ex: besoin de terminer tôt certains jours)
- Système de pondération des préférences (pour distinguer les souhaits des contraintes personnelles fortes)
- Historique des préférences exprimées et de leur prise en compte

### 1.2. Visibilité Anticipée

**Objectif** : Offrir une meilleure visibilité sur l'impact des demandes d'absence avant leur soumission.

**Mise en œuvre** :
- Lors de la demande d'absence, affichage en temps réel :
  - Du nombre de collègues déjà absents par jour
  - Du taux d'occupation du service par jour
  - Des périodes critiques (sous-effectif potentiel)
  - D'alertes visuelles selon le niveau d'impact
- Pour l'administrateur validant l'absence : 
  - Vue claire des conséquences sur la couverture du service
  - Suggestions de dates alternatives si nécessaire
  - Impact sur les règles de service minimum

### 1.3. Gestion des Exceptions

**Objectif** : Simplifier la procédure pour gérer les exceptions au modèle de travail habituel.

**Mise en œuvre** :
- Interface permettant de déclarer facilement :
  - Un jour travaillé exceptionnellement (jour normalement non travaillé)
  - Un jour non travaillé exceptionnellement (avec justification)
- Système de compensation intégré pour les exceptions
- Circuit de validation simplifié pour les exceptions ponctuelles
- Historisation et traçabilité des exceptions accordées

### 1.4. Alertes Proactives

**Objectif** : Mettre en place des alertes contextuelles basées sur les patterns habituels et les trames.

**Mise en œuvre** :
- Détection automatique des anomalies dans les patterns de présence
- Alertes pour les utilisateurs si :
  - Une absence habituelle (selon l'historique) n'a pas été déclarée
  - Un jour non travaillé selon la trame n'a pas d'absence associée
  - Des absences prévisibles n'ont pas encore été saisies (jours fériés, ponts)
- Notifications préventives pour les administrateurs sur les incohérences potentielles

## 2. Améliorations pour l'Administrateur/Planificateur

### 2.1. Vue Consolidée des Disponibilités

**Objectif** : Créer un tableau de bord montrant clairement toutes les sources d'indisponibilité par personne.

**Mise en œuvre** :
- Interface de visualisation multi-niveaux montrant pour chaque personne :
  - Les jours non travaillés structurels (issus du contrat/workPattern)
  - Les absences ponctuelles validées
  - Les demandes d'absence en attente
  - Les affectations issues des trames
- Filtres avancés pour affiner la visualisation
- Export des données pour analyse ou partage
- Vue chronologique et vue matricielle (utilisateurs/dates)

### 2.2. Outil de Simulation

**Objectif** : Permettre à l'administrateur de tester l'impact des modifications de configuration avant application.

**Mise en œuvre** :
- Module de simulation permettant d'explorer des scénarios comme :
  - "Que se passe-t-il si je modifie la trame de ce groupe d'IADEs ?"
  - "Comment serait impacté le planning si cette personne passait à temps partiel ?"
  - "Quelles seraient les conséquences d'un changement de règle de supervision ?"
- Comparaison visuelle entre la situation actuelle et la situation simulée
- Analyse des impacts sur l'équité, la couverture de service, et le respect des règles
- Possibilité d'appliquer les changements si le résultat est satisfaisant

### 2.3. Détection d'Anomalies

**Objectif** : Implémenter un système proactif de détection d'incohérences et d'optimisation.

**Mise en œuvre** :
- Système d'analyse en continu qui signale automatiquement :
  - Les IADEs marqués disponibles mais sans affectation
  - Les salles ouvertes sans personnel suffisant
  - Les incohérences entre trames et affectations réelles
  - Les violations potentielles des règles de temps de travail
  - La sous-optimisation des ressources (personnel non utilisé efficacement)
- Dashboard spécifique pour les anomalies avec niveau de criticité
- Suggestions correctives pour chaque type d'anomalie

### 2.4. Gestion des Remplacements

**Objectif** : Faciliter la gestion des absences imprévues et la recherche de remplaçants.

**Mise en œuvre** :
- Module qui, en cas d'absence imprévue :
  - Suggère automatiquement des remplaçants MAR ou IADE selon leurs compétences
  - Prend en compte l'équité dans les remplacements proposés
  - Indique la disponibilité en temps réel des remplaçants potentiels
  - Facilite le processus de notification et d'acceptation du remplacement
- Système de ranking des remplaçants selon plusieurs critères :
  - Compétences nécessaires pour le poste
  - Historique des remplacements effectués
  - Charge de travail actuelle
  - Proximité avec le secteur concerné

### 2.5. Tableaux de Bord d'Équité

**Objectif** : Créer des visualisations claires pour assurer une répartition équitable des charges de travail.

**Mise en œuvre** :
- Tableaux de bord visuels montrant la répartition sur différentes périodes :
  - Des gardes et astreintes
  - Des week-ends travaillés
  - Des périodes de vacances scolaires
  - Des affectations aux différents types de salles/secteurs
  - Des remplacements effectués
- Métriques d'équité personnalisables selon le contexte de l'établissement
- Alertes en cas de déséquilibre significatif
- Outils de correction pour rééquilibrer les affectations

## 3. Mise en Œuvre et Priorisation

Ces améliorations seront développées selon la priorisation suivante :

### Phase 1 (Court terme - P1)
- Expression des préférences (base)
- Vue consolidée des disponibilités
- Détection d'anomalies (niveau 1)

### Phase 2 (Moyen terme - P2)
- Visibilité anticipée
- Gestion des remplacements
- Tableaux de bord d'équité (base)

### Phase 3 (Long terme - P3)
- Outil de simulation
- Alertes proactives avancées
- Gestion des exceptions complète
- Tableaux de bord d'équité (avancés)

Ces améliorations visent à rendre le système plus intuitif et à fournir un meilleur support décisionnel, tout en conservant l'architecture robuste existante. 