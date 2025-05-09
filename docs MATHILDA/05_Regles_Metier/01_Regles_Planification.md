# Règles de Planification

Ce document détaille les règles métier spécifiques qui régissent l'affectation du personnel dans les différents secteurs et salles d'intervention. Ces règles sont fondamentales pour le bon fonctionnement de l'algorithme de génération des plannings.

## 1. Principes Généraux

*   **Affectation par Demi-Journée :** Le planning est structuré en demi-journées (ex: 8h-13h, 13h30-18h30, horaires configurables par secteur/site).
*   **Postes Clés :** Un "poste" correspond à l'affectation d'un personnel (MAR/IADE) à une activité (Bloc, Consultation, Garde, Astreinte, OFF) pour une demi-journée ou journée.
*   **Salle/Secteur :** Les affectations de bloc sont liées à une salle spécifique, qui appartient à un secteur.
*   **Chirurgien/Spécialité :** La présence d'un chirurgien (via la `TrameChirurgien`) dans une salle et un créneau détermine l'activité et la spécialité requise pour le personnel d'anesthésie.
*   **Supervision :** Toute salle où un IADE réalise l'anesthésie nécessite la supervision d'un MAR (sauf règles spécifiques contraires).
*   **Configurabilité :** De nombreuses règles mentionnées ici (seuils, points, horaires) doivent être configurables via l'interface d'administration (voir `docs/05_Regles_Metier/02_Regles_Configuration.md`).

## 2. Règles d'Affectation par Secteur

Chaque secteur de la clinique possède ses propres règles d'affectation du personnel d'anesthésie, reflétant les spécificités de son activité.

### 2.1 Secteur Endoscopie

- **Règle de couverture des salles :**
  - Si 1 salle : un personnel fait l'anesthésie d'une salle
  - si 2 salles: Un personnel fait l'anesthésie des deux salles
  - si 3 salles : un IADE fait l'anesthésie de deux salles et un MAR de la 3e , et supervise l'IADE du secteur
  - si 4 salles : un IADE fait l'anesthésie de deux salles, supervisé par le MAR qui fait l'anesthésie des deux autres salles.

- **Règle de continuité :**
  - Un IADE fait généralement matin ET après-midi dans ce secteur (journée complète)
  - un MAR ne fait jamais journée complète dans le secteur endoscopie

- **Règle de supervision :**
  - Si deux salles : l'IADE est seul et supervisé par un MAR du secteur septique, ou alors un MAR fait l'anesthésie du sectur endoscopie.
  - Si plus de deux salles (3 ou 4) : l'IADE et le MAR se partagent l'anesthésie
  - Le MAR supervise toujours les deux salles de l'IADE

### 2.2 Secteur Ophtalmo

- **Règle de couverture des salles :**
  - Un IADE ou MAR fait l'anesthésie de 1 à 3 salles
  - Si 4 salles : division 2+2 entre un MAR et un IADE (MAR fait 2 salles + supervise 2 salles de l'IADE)

- **Règle de continuité :**
  - Pas de journée entière dans ce secteur pour l'anesthésie
  - Si un personnel est affecté le matin, il ne peut pas être affecté l'après-midi et vice versa
  - Exception : possible pour la supervision uniquement

- **Règle de supervision élargie :**
  - Si un IADE est en Ophtalmo avec 1 à 3 salles, la supervision peut être assurée par un ou plusieurs MARs des secteurs Hyperaseptique, Intermédiaire ou Septique.

### 2.3 Secteurs Hyperaseptique, Intermédiaire et Septique

Ces trois secteurs suivent les mêmes règles générales :

- **Règle de couverture des salles :**
  - Un IADE fait l'anesthésie d'une seule salle
  - Un MAR fait l'anesthésie d'une seule salle
  - **Contrainte Spécialité/Salle :** Si une salle est configurée comme réservée à une spécialité, seuls les chirurgiens de cette spécialité peuvent y être affectés (selon la trame externe).

- **Règle de supervision :**
  - Un MAR peut superviser une ou exceptionnellement deux salles d'IADE **du même secteur ou d'un secteur immédiatement adjacent**.
  - Un MAR d'un de ces secteurs peut superviser jusqu'à 3 salles en Ophtalmo en plus de sa propre salle d'anesthésie (configuration à éviter mais possible).
  - **Règle Spécifique Pédiatrie :**
      *   Si un MAR est affecté en anesthésie dans une salle de chirurgie pédiatrique (identifiée par spécialité), il ne peut **PAS** superviser d'autre salle simultanément (sauf super exception validée manuellement).
      *   S'il supervise une salle de chirurgie pédiatrique (où un IADE fait l'anesthésie), il ne peut superviser qu'une seule autre salle au maximum (total 2 supervisions max).
      *   Un IADE peut faire l'anesthésie en pédiatrie sous supervision MAR.
  - Toute salle avec un IADE doit avoir un MAR qui supervise (du même secteur ou adjacent).
  - Si un IADE est présent, c'est lui qui fait l'anesthésie et le MAR supervise.
  - Un MAR et un IADE ne peuvent jamais être tous deux affectés en rôle anesthésie dans la même salle.
  - Pour le bloc opératoire, secteurs aseptique, intermédiaire et septique ,Un MAR supervise des salles de son secteur en priorité, voire contigües. sa supervision peut déborder de son secteur à la salle contigue (par exemple la salle 5 s'il est en secteur hyperaseptique 1 à 4)

- **Règle de continuité :**
  - En général, un personnel garde la même salle entre matin et après-midi
  - Exception : si la salle est vide (pas d'activité) sur l'un des créneaux

- **Règle spécifique pour la salle 8 :**
  - Réservée aux césariennes d'urgence
  - Ne doit pas apparaître sur le planning standard
  - Couverte par le personnel d'astreinte/garde ou redéployé en cas d'urgence

## 3. Règles d'Affectation par Rôle

### 3.1 Règles pour les MARs

- **Règle de garde :**
  - Une garde (24h) est incompatible avec toute autre affectation
  - Une garde implique automatiquement un REPOS le lendemain (aucune affectation possible). Cette journée non travaillée ne doit pas être décomptée de la meme façon que les demi-journées ou journées OFF de la semaine des MARS.
  
- **Règle d'astreinte :**
  - Une astreinte (24h) est cumulable avec d'autres affectations à l'exception d'une garde
  - Pas d'astreinte possible pour un MAR déjà de garde.
  - **Indisponibilités :** Les MARs doivent pouvoir déclarer leurs indisponibilités pour les gardes et/ou astreintes *avant* la génération du planning. L'algorithme ne doit pas leur attribuer de garde/astreinte sur ces périodes.
  - **Alerte Proximité :** Une alerte doit être générée (visuelle, notification) si l'algorithme attribue des gardes ou astreintes sur des week-ends consécutifs ou très rapprochés (ex: 1 seul WE libre entre deux WE d'obligation).
  
- **Règle de consultation :**
  - Une consultation (matin ou après-midi) est incompatible avec une garde ou une affectation de bloc
  - Pas de consultation matin ET après-midi le même jour, sauf exception validée par administrateur
  
- **Règle de bloc :**
  - Un MAR peut être affecté en rôle anesthésie ou supervision
  - Un MAR en supervision d'un IADE peut être simultanément en anesthésie dans une autre salle
  - Exceptionnellement : un MAR peut être en anesthésie dans une salle + supervision de deux autres salles (jusqu'à 3 salles d'Ophtalmo, voir 1.3)
  - **Préférences/Interdits Spécialités/Chirurgiens/Personnel :** L'algorithme prend en compte les préférences (ex: préférer Dr. A pour le secteur X) ou interdits (ex: Dr. B ne va jamais en pédiatrie, Dr C ne supervise jamais Dr D) configurés. **Cette fonctionnalité doit exister même si non utilisée initialement.**
  - **Préférences/Interdits Compétences :** L'algorithme prend en compte les compétences requises/préférées pour certaines salles/spécialités.

### 3.2 Règles pour les IADEs

- **Règle d'affectation générale :**
  - Un IADE ne peut avoir que des affectations de bloc/anesthésie
  - Pas de rôle de supervision, pas d'astreinte, pas de garde
  - **Un IADE présent sur un jour travaillé DOIT avoir une affectation.**
  
- **Règle de l'IADE "volant" :**
  - Désigné à l'avance par semaine (potentiellement via import trame IADE, configurable).
  - Jours modulables selon les besoins (modification manuelle par admin IADE/MAR possible).
  - L'IADE volant doit être clairement identifiable sur le planning (ex: couleur spécifique).
  - L'admin évitera de morceler les journées de l'IADE volant (pas de demi-journées isolées).

- **Règle de l'IADE "de fermeture" :**
  - Désigné par jour, reste plus tard si besoin.
  - Peut être désigné lors de la génération du planning ou pré-renseigné via la trame IADE.
  - Répartition équitable au prorata du temps de travail.
  - Pas deux fermetures dans la même semaine.
  - Nécessité de monitorer l'équité (compteur spécifique `fermetures_total`, `fermetures_vendredi`), notamment pour les vendredis.

- **Règle de planning de base :**
  - Le planning des IADEs est initialement importé depuis leur trame existante (configurable).
  - L'application ajuste ensuite l'affectation précise des salles.

- **(Potentiel) Règle de Garde IADE :** Si activée, mêmes règles d'incompatibilité et de repos que pour les MARs.
- **(Potentiel) Règle d'Astreinte IADE :** Si activée, mêmes règles de cumul que pour les MARs.

- **Préférences/Interdits Spécialités/Chirurgiens/Compétences :** Similaires aux MARs, l'algorithme prend en compte les configurations.

## 4. Règles de Répartition et d'Équité

*   **Proratisation au Temps de Travail :** TOUS les compteurs d'équité (gardes, astreintes, consultations, week-ends, fériés, fermetures, etc.) doivent être calculés et comparés en tenant compte du pourcentage de temps de travail (`workingTime` dans la table `users`).
    *   Soit les compteurs bruts sont stockés et la comparaison se fait sur une valeur normalisée (compteur / temps_travail).
    *   Soit des compteurs "pondérés" sont calculés (ex: 1 garde pour un 50% compte double).
    *   Les rapports devront afficher les valeurs brutes ET les valeurs normalisées/pondérées pour comparaison.
*   **Période d'Équilibre :** L'équilibre est visé sur l'année civile, mais peut être suivi sur des périodes plus courtes (mois, trimestre) et potentiellement lissé sur plusieurs années (ex: 2-3 ans pour les gardes WE/fériés).
*   **Gestion Manuelle Prioritaire :** La distribution manuelle des jours spécifiques (WE, fériés, vendredis) faite par les administrateurs *avant* la génération automatique prime sur l'équilibrage automatique pour ces jours spécifiques. L'algorithme doit respecter ces pré-affectations.

### 4.1 Compteurs d'Équité MAR

Les compteurs suivants doivent être suivis par MAR (et utilisés pour l'équilibrage P2) :

*   `gardes_total`
*   `gardes_semaine`
*   `gardes_we`
*   `gardes_ferie`
*   `gardes_vendredi` (si distinct des gardes WE)
*   `astreintes_total` (proratisé)
*   `consultations_matin` (proratisé)
*   `consultations_aprem` (proratisé)
*   `consultations_vendredi_aprem` (proratisé)
*   `bloc_demijournee_total` (proratisé)
*   `bloc_vendredi_aprem` (proratisé)
*   `we_vendredi_travaille` (nombre de vendredis)
*   `we_samedi_travaille` (nombre de samedis)
*   `we_dimanche_travaille` (nombre de dimanches)
*   `jours_feries_travailles`
*   `demijournees_par_specialite` (ex: `dj_ortho`, `dj_pedia_anest`, `dj_pedia_superv`... à définir précisément)
*   `score_penibilite_moyen` (sur la période)
*   `heures_travaillees_mois` (si pertinent)
*   `solde_heures_cumul` (si pertinent)

### 4.2 Compteurs d'Équité IADE

Les compteurs suivants doivent être suivis par IADE (et utilisés pour l'équilibrage P2) :

*   `fermetures_total` (proratisé)
*   `fermetures_vendredi` (proratisé)
*   `demijournees_par_specialite` (ex: `dj_ortho`, `dj_visceral`...)
*   `conges_payes_pris`
*   `conges_payes_restants` (nécessite solde initial)
*   (Optionnel si gardes/astreintes IADE activées : compteurs similaires aux MARs)

### 4.3 Système de Points de Pénibilité (MARs)

- Mettre en place un système de points pour quantifier la charge de travail/pénibilité.
- **Calcul des Points (Exemple Configurable) :**
  - Affectation Anesthésie simple (1 salle) : 1 point / demi-journée.
  - Affectation Supervision (1 salle IADE) : +0.5 points / demi-journée (total 1.5 si anesthésie + supervision).
  - Affectation Supervision (2 salles IADE) : +0.75 points supplémentaires / demi-journée (total 1.75 si anesthésie + 2 supervisions).
  - Affectation Endoscopie (Anesthésie 2 salles) : 1 point / demi-journée.
  - Affectation Endoscopie (Supervision 2 salles IADE) : 0.5 points / demi-journée (total 1.5 si anesthésie + supervision).
  - Affectation Ophtalmo (Anesthésie 1-3 salles) : 1 point / demi-journée.
  - Affectation Ophtalmo (Supervision 1-2 salles IADE) : 0.5 points / demi-journée.
  - Consultation Matin : 1 point.
  - Consultation Après-midi : 1.5 points.
  - Garde (semaine/WE/férié) : 5 points (configurable, potentiellement différentié).
  - Repos de Garde : Effet inverse sur le score (ex: -3 points ? configurable).
- **Accumulation :** Calcul d'un score glissant sur les 7 derniers jours (configurable).
- **Objectif :**
  1.  **Alerte Surcharge :** Signaler si un MAR dépasse un seuil de points sur 7 jours (configurable).
  2.  **Aide à l'attribution d'OFF :** Lors de l'équilibrage P2, si plusieurs MARs sont éligibles à un OFF (même temps de travail, compteurs horaires similaires), prioriser celui avec le score de pénibilité le plus élevé sur la période récente.
  3.  **Équilibrage Qualitatif (Secondaire) :** Tenter de minimiser les écarts de score de pénibilité *après* avoir satisfait les contraintes P0/P1 et l'équilibrage du temps OFF (P2).
- **Pondération :** Dans l'algorithme (Priorité P2), l'équilibrage du **temps OFF** reste prioritaire sur l'équilibrage du score de **pénibilité**. Le score de pénibilité aide surtout à l'alerte et à départager les cas limites pour l'attribution des OFF.
- Les seuils et valeurs de points doivent être configurables (voir [Règles de Configuration](./02_Regles_Configuration.md#74-table-config_points_penibilite)).

## 5. Algorithme de Génération et Gestion des Conflits

### 5.1 Principe Général de Génération

*   **Automatique avec Validation :** L'algorithme propose une solution complète basée sur les règles et les données (trame chir, indispos, congés).
*   **Validation Humaine :** Le planning généré est un "brouillon" qui doit être revu et validé/publié par un administrateur.
*   **Alertes Visuelles :** Le brouillon doit mettre en évidence les problèmes potentiels (règles P2/P3 non optimales, alertes proximité garde/WE, score fatigue élevé).
*   **Proposition d'Alternatives :** Si des règles sont violées ou des affectations impossibles, l'algorithme (ou l'interface post-génération) devrait idéalement proposer des alternatives ou indiquer clairement le point de blocage.

### 5.1.1 Approches Algorithmiques Possibles

La génération automatique du planning est un problème complexe combinant satisfaction de contraintes strictes (P0, P1) et optimisation multi-objectifs (P2, P3). Plusieurs approches peuvent être envisagées :

*   **Algorithme Basé sur des Règles / Heuristiques :**
    *   **Principe :** Suit une série de règles et de priorités définies (P-1 à P3). Affecte les tâches en priorisant les plus contraintes et en utilisant des heuristiques pour choisir le personnel selon l'équité et la pénibilité.
    *   **Avantages :** Simple à comprendre et implémenter initialement, contrôle direct du processus.
    *   **Inconvénients :** Ne garantit pas l'optimalité, peut avoir du mal avec les impasses (backtracking limité), maintenance potentiellement complexe.
*   **Programmation par Contraintes (PPC) / Solveur de Contraintes (ex: Google OR-Tools) :**
    *   **Principe :** Modélise le problème (variables, domaines, contraintes). Un solveur externe explore l'espace des solutions pour respecter les contraintes et optimiser les objectifs.
    *   **Avantages :** Très puissant pour gérer des contraintes complexes, garantit de trouver une solution si elle existe (pour P0/P1), peut trouver des solutions optimales.
    *   **Inconvénients :** Nécessite l'apprentissage d'une bibliothèque externe, peut être plus lent, moins de contrôle direct sur la construction de la solution.
*   **Approche Hybride :**
    *   **Principe :** Combine les deux, par exemple règles pour P-1/P0/P1 critiques, puis solveur ou heuristique avancée pour l'optimisation P2/P3.
    *   **Avantages :** Combine rapidité des règles et puissance des solveurs.
    *   **Inconvénients :** Plus complexe à intégrer.

**Approche retenue initialement :** Nous commencerons par une approche **basée sur des Règles / Heuristiques** car elle correspond bien à la logique métier et aux priorités définies. Si nécessaire, nous pourrons évoluer vers une approche hybride ou basée sur un solveur.

### 5.1.2 Workflow de Génération Proposé (Approche Règles/Heuristiques)

1.  **Initialisation :** Chargement des données (période, trame chir, congés, indispos, affectations P-1, requêtes P1 validées), calcul des besoins, chargement des compteurs.
2.  **Phase 1 : Affectations Critiques (Respect P-1, P0, P1)**
    *   Placer P-1.
    *   Marquer indispos P0.
    *   Pour chaque créneau à pourvoir : identifier personnel éligible, tenter d'affecter en respectant P1 (supervision, pédiatrie...). Prioriser contraintes fortes.
    *   Si conflit P1 insoluble -> marquer créneau "vide"/"conflit P1".
3.  **Phase 2 : Équilibrage et Optimisation (Respect P2, puis P3)**
    *   Parcourir créneaux restants et personnel dispo.
    *   Pour chaque affectation possible : calculer score basé sur P2 (équité gardes, WE, OFF, consult, fermetures ; pénibilité en critère secondaire pour OFF).
    *   Attribuer à l'utilisateur améliorant le plus l'équité P2.
    *   Si choix équivalents en P2 -> appliquer préférences P3 (continuité...). 
4.  **Phase 3 : Vérification et Finalisation**
    *   Vérification finale des règles.
    *   Identifier créneaux vides/conflits P1.
    *   Générer alertes (proximité gardes, pénibilité...). 
    *   Présenter le brouillon à l'admin.

### 5.2 Ordre de Priorité des Contraintes

L'algorithme de génération automatique suivra cet ordre strict de priorité :

1.  **Données Pré-remplies (P-1) :**
    *   Affectations manuelles spécifiques (WE, fériés, vendredis) faites par l'admin avant génération.
2.  **Contraintes Inviolables (P0) :**
    *   Congés validés.
    *   Gardes et astreintes planifiées (et repos post-garde associé).
    *   Indisponibilités déclarées (gardes/astreintes).
    *   Absences déclarées.
3.  **Règles Essentielles (P1) :**
    *   Couverture minimale requise par secteur/activité (basée sur trame chirurgien).
    *   Règles de supervision (MAR supervise IADE).
    *   Règles spécifiques (Pédiatrie, Salle 8).
    *   Incompatibilités strictes (personnel, compétence, spécialité).
    *   Règles de base d'affectation par rôle (ex: IADE ne supervise pas).
    *   Requêtes spécifiques validées par l'administrateur.
4.  **Objectifs d'Équité et Pénibilité (P2) :**
    *   Répartition équitable des gardes/astreintes (selon compteurs proratisés).
    *   Répartition équitable des jours WE (V, S, D) et Fériés (selon compteurs proratisés) **si non pré-remplis en P-1**.
    *   Équilibrage du temps OFF (demi-journées) au prorata du temps de travail.
    *   Répartition équitable des consultations (MAR).
    *   Répartition équitable des fermetures (IADE).
    *   Prise en compte du score de pénibilité (MARs) pour **alerte** et **aide à l'attribution d'OFF**.
5.  **Préférences et Optimisations (P3) :**
    *   Minimisation des écarts de score de pénibilité (objectif secondaire).
    *   Continuité des affectations (même salle matin/après-midi).
    *   Prise en compte des compétences/spécialités préférées.
    *   Préférences inter-personnel.
    *   Requêtes spécifiques non validées.

*Note : Une requête spécifique validée (P1) ou un interdit configuré (P1) outrepasse les objectifs d'équité/pénibilité (P2) et les optimisations (P3). Les affectations manuelles P-1 priment sur tout le reste.* 

### 5.3 Gestion de l'Absence de Solution

- Si l'algorithme ne peut satisfaire toutes les contraintes P-1, P0 et P1 :
  - Il doit **prioriser le respect des contraintes P0 et des contraintes P1 critiques** (ex: incompatibilité Garde/Bloc, supervision impossible en pédiatrie, interdits stricts).
  - Si, même en respectant cette priorité, une affectation nécessaire ne peut être pourvue (ex: pas de MAR disponible pour une salle), l'algorithme doit **laisser l'affectation problématique vide ("trou")**.
  - Il doit générer un rapport **signalant précisément** les conflits non résolus et les "trous" laissés (quelle règle P0/P1, quel personnel/salle/créneau), afin que l'administrateur puisse intervenir manuellement (ex: trouver un remplaçant).
- Possibilité (configurable) de relâcher certaines contraintes P1 **moins critiques** (ex: règles de supervision élargies temporairement, max salles ophtalmo) pour tenter de trouver une solution, tout en signalant explicitement ce relâchement dans le rapport de génération.

### 5.4 Gestion Manuelle Post-Génération et Conflits

- L'administrateur doit pouvoir modifier manuellement le planning généré.
- Actions possibles : interchanger deux personnes, déplacer une affectation, créer/supprimer une affectation.
- Si une modification manuelle **viole une règle** :
  - **Règle P0/P1 (critique) :** Affichage en **ROUGE** vif + message d'alerte bloquant ou nécessitant confirmation explicite avec motif.
  - **Règle P2/P3 (mineure) :** Affichage en **ORANGE** + message d'alerte informatif non bloquant.
- L'alerte doit détailler la règle violée.

### 5.5 Règles de Gestion des Congés

- **Conflits :** Si plusieurs demandes sont en attente sur une période où le nombre d'absents deviendrait critique, la décision revient à l'administrateur (pas de règle FIFO stricte). L'interface doit l'alerter sur le nombre d'absents potentiels.

- **Règle d'acceptation automatique :**
  - Acceptation automatique si demande faite **1 mois à l'avance** (configurable).
  - Et si aucun autre personnel du même corps de métier n'est déjà en congé ce jour-là (seuil configurable).
  - Sinon, approbation manuelle par administrateur requise.
  
- **Règle de visualisation :**
  - L'administrateur doit pouvoir visualiser le nombre de personnes déjà en congé.
  - Et les autres demandes en attente pour la même période.

### 5.6 Règles pour les Échanges d'Affectations

- **Règle de compatibilité :**
  - Un MAR peut demander à échanger ses affectations uniquement avec un autre MAR.
  - Un IADE peut demander à échanger uniquement avec un autre IADE.
  - L'application filtre et propose uniquement les affectations compatibles.
  
- **Règle pour les gardes :**
  - Pour les gardes, le système propose les jours/personnes compatibles.
  - Avec respect des contraintes de repos post-garde et d'espacement entre gardes.
  
- **Règle de validation :**
  - Une fois la requête d'échange faite, elle doit être approuvée par la personne concernée.
  - L'administrateur est notifié mais son approbation n'est pas requise sauf configuration contraire.

## 6. Gestion des Temps Partiels

- Le temps de travail (ex: 80%, 50%) doit être configurable pour chaque MAR et IADE par l'administrateur.
- L'algorithme doit prendre en compte ce temps partiel pour :
  - La répartition équitable des gardes, consultations, fermetures, etc.
  - L'équilibrage du temps OFF.
  - Le calcul des compteurs horaires cibles.
- L'interface doit permettre de visualiser facilement les jours/demi-journées non travaillés spécifiques aux temps partiels.

## 2. Gestion des Astreintes

### 2.1 Règles d'Attribution
- Répartition équitable entre les personnels
- Pas de règles spécifiques hormis :
  * Éviter l'enchaînement weekend d'astreinte et weekend de garde
  * Incompatibilité avec les gardes
- Suivi du nombre d'astreintes par personne
- Attention particulière aux astreintes de weekend et jours fériés pour l'équité

## 3. Catégories de Personnel

### 3.1 Personnel Junior
- Rôle spécifique "Junior" pour MAR et IADE
- Règles d'affectation particulières selon le statut junior
- Possibilité de définir des restrictions spécifiques pour les juniors

## 4. Gestion des Trames

### 4.1 Trames Chirurgicales
- Système de trames basé sur l'alternance semaines paires/impaires
- Base fondamentale pour l'organisation du planning
- Possibilité d'inclure les MARS et IADES dans les trames
- Objectif de rotation équitable :
  * Tous les personnels doivent travailler avec tous les chirurgiens
  * Exposition à toutes les spécialités

### 4.2 Flexibilité des Plannings
- Pas de modèles fixes pour les plannings MARS et IADEs
- Adaptation continue en fonction :
  * Du nombre de salles
  * Des chirurgiens présents
  * Du personnel d'anesthésie disponible
- Planning "roulant" pour les IADEs avec variation hebdomadaire

## 5. Visualisation et Exports

### 5.1 Affichage dans l'Application
- Visualisation directe des plannings dans l'interface
- Priorité donnée à la consultation en temps réel
- Fonctionnalités d'export disponibles en complément

### 5.2 Gestion des Compteurs
- Possibilité de modification manuelle des compteurs par utilisateur
- Ajustement des compteurs initiaux selon les besoins 