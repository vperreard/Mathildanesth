# Validation Manuelle et Ajustements du Planning

## 1. Vue d'ensemble

Même avec un moteur de génération de planning avancé, une étape de validation et d'ajustement manuel par un planificateur humain reste souvent indispensable. Cette étape permet de gérer les cas imprévus, d'appliquer un jugement humain sur des situations complexes que l'algorithme n'aurait pas pu anticiper, et d'affiner le planning pour une optimisation maximale ou pour répondre à des contraintes de dernière minute.

Mathildanesth doit donc fournir des outils performants et intuitifs pour cette phase cruciale.

## 2. Accès à la Fonctionnalité

- Après une génération automatique, le planificateur peut choisir d'ouvrir le planning proposé dans un mode "Édition" ou "Ajustement".
- Un planning existant (déjà publié ou en brouillon) peut également être ouvert pour modification.
- L'accès est généralement réservé aux rôles `ADMIN` ou `PLANNER`.

## 3. Interface d'Édition du Planning

L'interface d'édition reprend la visualisation calendaire standard mais y ajoute des fonctionnalités d'interaction directe :

### 3.1. Sélection et Modification d'Affectations
- **Clic sur une affectation** : Ouvre un panneau ou un modal avec les détails de l'affectation (utilisateur, type, dates/heures, lieu, etc.).
- **Modification des détails** : Possibilité de changer l'utilisateur assigné, de modifier les heures, de changer le type d'affectation, etc.
- **Glisser-déposer (Drag & Drop)** : 
    - Pour déplacer une affectation d'un jour/heure à un autre.
    - Pour réassigner une affectation d'un utilisateur à un autre (si la vue le permet, par ex. une vue par utilisateur).
- **Suppression d'affectation**.
- **Ajout manuel d'une nouvelle affectation** : Un bouton "+" sur une case horaire ou un menu contextuel pour créer une affectation de A à Z.

### 3.2. Assistance à la Modification
- **Vérification des règles en temps réel** : Lors d'un ajustement manuel, le système devrait idéalement ré-évaluer instantanément les règles concernées :
    - Affichage d'avertissements ou d'erreurs si la modification manuelle viole une règle.
    - Suggestion de remplacements ou d'alternatives si un utilisateur est retiré d'une affectation critique.
- **Affichage des disponibilités** : En voulant assigner un utilisateur, voir rapidement ses autres affectations, ses indisponibilités, ses soldes (congés, heures).
- **Filtrage intelligent des utilisateurs** : Pour une affectation donnée, ne proposer que les utilisateurs compétents et potentiellement disponibles.

### 3.3. Outils d'Analyse Intégrés
- **Vue des compteurs d'équité** : Afficher en temps réel comment les modifications impactent les compteurs de gardes, week-ends, etc., pour l'utilisateur concerné et pour l'équipe.
- **Indicateur de charge de travail** : Visualiser la charge de travail des utilisateurs (ex: par des codes couleurs sur leurs noms ou des graphiques sommaires).
- **Détection de "trous" dans le planning** : Mettre en évidence les besoins non couverts suite à des modifications.

## 4. Gestion des Versions et des Modifications

- **Sauvegarde manuelle ("Enregistrer")** : Les modifications ne sont pas forcément sauvegardées automatiquement à chaque clic pour éviter les erreurs.
- **Option "Annuler/Rétablir" (Undo/Redo)** : Essentiel pour permettre de revenir sur des modifications.
- **Historique des modifications (simple)** : Qui a modifié quoi et quand sur ce planning (au moins pour la session d'édition en cours).
- **Comparaison avec version précédente** (avancé) : Possibilité de voir les différences par rapport au planning généré initialement ou à la dernière version publiée.

## 5. Validation Finale et Publication

Une fois les ajustements terminés :

- **Bouton "Valider et Publier"** : Rend le planning officiel et visible par les utilisateurs concernés.
- **Vérification finale des règles** : Avant la publication, une dernière passe de validation des règles critiques peut être effectuée.
- **Options de notification** : Lors de la publication, notifier les utilisateurs des changements ou de la disponibilité du nouveau planning (voir `04_Publication_Notifications.md`).
- **Archivage de la version précédente** : L'ancienne version publiée est archivée pour consultation ultérieure (voir `05_Gestion_Historique_Plannings.md`).

## 6. Cas Particuliers et Scénarios Complexes

- **Gestion des échanges d'affectations entre utilisateurs** : Si un échange est initié manuellement par le planificateur, le système doit vérifier que les deux utilisateurs sont compétents pour les affectations échangées et que cela ne crée pas de nouveaux conflits.
- **Réponse à une absence imprévue** : L'interface doit permettre de rapidement désaffecter un utilisateur devenu absent et de trouver/assigner un remplaçant, en s'aidant des outils de disponibilité et de compétence.

L'ergonomie de cette interface est primordiale. Les planificateurs peuvent y passer beaucoup de temps, elle doit donc être efficace, réactive et minimiser le risque d'erreurs. 