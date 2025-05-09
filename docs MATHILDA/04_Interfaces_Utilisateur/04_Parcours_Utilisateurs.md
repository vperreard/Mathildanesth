# Parcours Utilisateurs

Ce document décrit les principaux parcours utilisateurs (user flows) dans l'application MATHILDA, illustrant comment différents types d'utilisateurs interagissent avec le système pour accomplir leurs tâches.

## 1. Parcours Administrateur

### 1.1 Configuration initiale du système

**Acteur:** Super Admin ou Admin MAR  
**Objectif:** Configurer l'application pour son établissement  
**Préconditions:** Compte créé avec les droits appropriés

1. **Connexion au système**
   - L'administrateur se connecte avec ses identifiants
   - Le système affiche le tableau de bord avec accès au menu "Configuration"

2. **Configuration des sites**
   - L'administrateur accède à l'onglet "Sites & Organisation"
   - Il crée un ou plusieurs sites avec leurs informations de base
   - Le système enregistre les sites et les affiche dans l'arborescence

3. **Création des secteurs**
   - Pour chaque site, l'administrateur ajoute les secteurs opératoires
   - Il définit l'ordre d'affichage via glisser-déposer
   - Le système enregistre les secteurs et reflète l'ordre choisi

4. **Création des salles**
   - Pour chaque secteur, l'administrateur ajoute les salles
   - Il configure les propriétés spécifiques de chaque salle
   - Il organise l'ordre des salles via glisser-déposer
   - Le système enregistre la configuration des salles

5. **Configuration des utilisateurs**
   - L'administrateur passe à l'onglet "Utilisateurs & Rôles"
   - Il crée les comptes pour le personnel médical (MARs, IADEs)
   - Il attribue les rôles appropriés et défini les compteurs initiaux
   - Le système envoie des invitations aux utilisateurs créés

6. **Configuration des paramètres métier**
   - Dans l'onglet "Règles & Planification", l'administrateur :
     - Définit les horaires de travail
     - Configure les points de pénibilité
     - Paramètre les règles d'affectation spécifiques
   - Le système enregistre ces paramètres pour la génération de planning

**Résultat:** Le système est prêt à être utilisé pour la planification

### 1.2 Génération d'un planning mensuel

**Acteur:** Admin MAR  
**Objectif:** Générer un planning pour le mois à venir  
**Préconditions:** Configuration initiale effectuée, congés et indisponibilités saisis

1. **Préparation des paramètres**
   - L'administrateur accède à la vue Planning
   - Il sélectionne la période à planifier (ex: mois prochain)
   - Il vérifie les indisponibilités déjà saisies

2. **Lancement de la génération**
   - Il clique sur "Générer planning"
   - Il configure les options de génération (stricte/souple)
   - Le système lance l'algorithme en tâche de fond
   - Une notification indique que le traitement est en cours

3. **Consultation des résultats**
   - Une fois terminé, le système notifie l'administrateur
   - L'administrateur consulte le planning généré
   - Il vérifie les éventuels "trous" ou conflits signalés

4. **Ajustements manuels**
   - Pour chaque trou/conflit :
     - L'administrateur consulte le rapport détaillé
     - Il effectue des ajustements manuels (drag & drop)
     - Le système vérifie et signale les problèmes potentiels
     - L'administrateur valide ou ignore les alertes

5. **Finalisation et publication**
   - L'administrateur vérifie l'équilibre des compteurs
   - Il apporte les derniers ajustements si nécessaire
   - Il publie le planning via le bouton "Publier"
   - Le système envoie des notifications à tous les utilisateurs concernés

**Résultat:** Un planning mensuel équilibré et publié

## 2. Parcours Personnel Médical

### 2.1 Consultation du planning et demande de congé

**Acteur:** MAR ou IADE  
**Objectif:** Consulter son planning et demander un congé  
**Préconditions:** Compte utilisateur actif

1. **Connexion et consultation du planning**
   - L'utilisateur se connecte à l'application
   - Il visualise son planning personnel (vue par défaut)
   - Il peut basculer entre différentes vues (jour, semaine, mois)

2. **Vérification des disponibilités**
   - L'utilisateur navigue vers la période souhaitée
   - Il vérifie ses affectations existantes
   - Il consulte les compteurs d'équité actuels

3. **Saisie d'une demande de congé**
   - Il clique sur "Demander congé"
   - Il sélectionne les dates de début/fin
   - Il choisit le type de congé (RTT, congé annuel, formation, etc.)
   - Il ajoute un commentaire si nécessaire
   - Il soumet la demande

4. **Suivi de la demande**
   - Le système enregistre la demande et affiche son statut "En attente"
   - L'utilisateur peut consulter toutes ses demandes dans "Mes demandes"
   - Il reçoit une notification lors de l'approbation/rejet

**Résultat:** Demande de congé soumise et en attente de validation

### 2.2 Proposition d'échange d'affectation

**Acteur:** MAR ou IADE  
**Objectif:** Échanger une affectation avec un collègue  
**Préconditions:** Planning publié avec des affectations

1. **Identification de l'affectation à échanger**
   - L'utilisateur consulte son planning
   - Il identifie l'affectation qu'il souhaite échanger
   - Il clique sur cette affectation et sélectionne "Proposer échange"

2. **Sélection du destinataire**
   - Le système affiche la liste des collègues disponibles
   - L'utilisateur sélectionne un collègue
   - Optionnellement, il suggère une affectation spécifique en échange

3. **Envoi de la proposition**
   - L'utilisateur ajoute un message explicatif
   - Il soumet la proposition d'échange
   - Le système envoie une notification au collègue ciblé

4. **Suivi de la proposition**
   - L'utilisateur peut voir sa proposition dans "Mes échanges" (statut "En attente")
   - Il est notifié lorsque le collègue accepte/refuse
   - Si acceptée, l'administrateur est notifié pour validation finale

**Résultat:** Proposition d'échange envoyée au collègue

## 3. Parcours Responsable Planning

### 3.1 Validation des demandes de congés

**Acteur:** Admin MAR  
**Objectif:** Traiter les demandes de congés  
**Préconditions:** Demandes en attente

1. **Consultation des demandes**
   - L'administrateur accède à "Gestion des congés"
   - Il visualise toutes les demandes en attente
   - Il peut filtrer par service, période, ou statut

2. **Analyse d'une demande**
   - Il sélectionne une demande spécifique
   - Il consulte les détails (dates, type, commentaire)
   - Il vérifie l'impact sur le planning à l'aide de la vue superposée

3. **Prise de décision**
   - En fonction de l'analyse, l'administrateur :
     - Approuve la demande
     - Rejette la demande (avec motif)
     - Propose une modification (dates alternatives)
   - Le système met à jour le statut et notifie l'utilisateur concerné

4. **Mise à jour du planning**
   - Si approuvée, le système marque les dates comme "indisponible" dans le planning
   - Les compteurs de congés de l'utilisateur sont mis à jour

**Résultat:** Toutes les demandes traitées et planning à jour

## 4. Parcours Super Admin

### 4.1 Audit des modifications de planning

**Acteur:** Super Admin  
**Objectif:** Vérifier l'historique des modifications d'un planning  
**Préconditions:** Planning publié avec modifications

1. **Accès à l'historique**
   - Le super admin se connecte et accède à "Audit & Historique"
   - Il définit la période à analyser
   - Il peut filtrer par type d'action, utilisateur, ou secteur

2. **Consultation des modifications**
   - Le système affiche la liste chronologique des modifications
   - Pour chaque entrée : date/heure, utilisateur, action, détails
   - Le super admin peut voir l'avant/après de chaque modification

3. **Analyse détaillée**
   - Il peut sélectionner une modification spécifique
   - Le système affiche les détails complets de la modification
   - Il peut comparer avec d'autres modifications connexes

4. **Export du rapport**
   - Si nécessaire, il peut exporter l'historique en CSV/PDF
   - Le rapport inclut toutes les informations pertinentes

**Résultat:** Analyse complète des modifications apportées au planning 