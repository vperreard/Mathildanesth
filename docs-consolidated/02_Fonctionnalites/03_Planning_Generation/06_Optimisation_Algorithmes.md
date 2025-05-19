# Optimisation et Algorithmes de Génération

## 1. Vue d'ensemble

La génération automatique de plannings est un problème d'optimisation complexe (souvent de type "NP-difficile"), où il s'agit de satisfaire un grand nombre de contraintes (règles dures) tout en essayant de maximiser la qualité du planning selon divers critères (règles souples, équité, préférences).

Ce document ne vise pas à décrire en détail un algorithme spécifique (qui relève de la conception technique profonde et peut évoluer), mais plutôt à présenter les concepts et approches générales qui peuvent être utilisés ou considérés dans Mathildanesth pour l'optimisation des plannings.

## 2. Objectifs de l'Optimisation

L'algorithme de génération de planning cherche à trouver une solution qui :

- **Respecte toutes les règles bloquantes (dures)** : C'est la condition sine qua non. Un planning violant une règle dure est généralement considéré comme invalide.
- **Minimise les violations des règles souples (préférences, objectifs d'équité)** : Chaque règle souple non respectée peut entraîner un "coût" ou une "pénalité". L'algorithme tente de minimiser la somme de ces coûts.
- **Maximise la couverture des besoins** : S'assurer que tous les postes requis sont pourvus.
- **Optimise l'équité** : Répartir de manière aussi juste que possible les gardes, astreintes, week-ends, types de tâches, etc.
- **Prend en compte la continuité et la qualité de vie** : Éviter les enchaînements difficiles, gérer la fatigue.

## 3. Approches Algorithmiques Possibles (Concepts Généraux)

Plusieurs familles d'algorithmes peuvent être utilisées ou combinées pour résoudre les problèmes de planification du personnel. Le choix dépend de la complexité spécifique des règles, de la taille des équipes, et des performances attendues.

### 3.1. Algorithmes Basés sur des Contraintes (Constraint Programming - CP)
- **Principe** : On définit un ensemble de variables (ex: qui est affecté à quelle tâche), leurs domaines (ex: liste des utilisateurs possibles pour une tâche), et un ensemble de contraintes (les règles). Un solveur de contraintes explore ensuite l'espace des solutions possibles pour en trouver une qui satisfait toutes les contraintes.
- **Avantages** : Très puissant pour exprimer des règles complexes et trouver des solutions valides. De nombreux solveurs CP existent.
- **Inconvénients** : Peut être lent si l'espace de recherche est très grand ou si les contraintes sont mal formulées. L'optimisation (trouver la *meilleure* solution, pas juste *une* solution) peut nécessiter des extensions.

### 3.2. Algorithmes Heuristiques et Métaheuristiques
- **Principe** : Au lieu d'explorer tout l'espace de recherche, ces algorithmes utilisent des "règles empiriques" (heuristiques) pour construire une solution pas à pas, ou pour améliorer une solution existante.
    - **Construction Heuristique** : Ex: placer d'abord les affectations les plus difficiles (gardes), puis combler les trous en choisissant l'utilisateur "le moins pénalisé" ou "le plus approprié" selon certains critères.
    - **Métaheuristiques (amélioration locale)** : Partir d'une solution (même médiocre) et l'améliorer itérativement par petites modifications (ex: Recuit Simulé, Recherche Tabou, Algorithmes Génétiques).
        - *Algorithmes Génétiques* : Simulent l'évolution naturelle. Des "populations" de plannings sont créées, les meilleurs sont "croisés" et "mutés" pour générer de nouvelles solutions, en espérant converger vers un optimum.
- **Avantages** : Peuvent trouver de bonnes solutions en un temps raisonnable, même pour de grands problèmes. Flexibles pour intégrer divers types de coûts et d'objectifs.
- **Inconvénients** : Ne garantissent pas de trouver la solution optimale globale. La qualité de la solution dépend beaucoup du design de l'heuristique.

### 3.3. Programmation Linéaire (PL) et Programmation Linéaire en Nombres Entiers (PLNE)
- **Principe** : On modélise le problème avec une fonction objectif linéaire (ex: minimiser le coût total des violations de règles souples) et des contraintes linéaires. Si les variables doivent être entières (ex: un utilisateur est affecté ou non, pas à moitié), on parle de PLNE.
- **Avantages** : Garanti de trouver la solution optimale si le problème peut être formulé ainsi. Des solveurs PL/PLNE très performants existent.
- **Inconvénients** : Toutes les règles ne se traduisent pas facilement en contraintes linéaires. La taille du modèle peut devenir très grande.

### 3.4. Approches Hybrides
- Souvent, la meilleure solution est une combinaison de techniques. Par exemple, utiliser un solveur CP pour générer une première solution valide, puis une métaheuristique pour l'optimiser selon des critères d'équité plus complexes.
- Ou encore, décomposer le problème : planifier les gardes avec une méthode, puis les activités de jour avec une autre.

## 4. Prise en Compte de l'Équité

L'équité est souvent un objectif difficile à formaliser purement en contraintes dures. Elle est mieux gérée via :
- **Des compteurs** : Suivi du nombre de gardes, week-ends, etc., pour chaque utilisateur.
- **Des fonctions de coût dans l'optimisation** : Pénaliser les écarts importants par rapport à la moyenne ou à des cibles d'équité.
- **Des passes d'ajustement spécifiques** : Après une première génération, une étape peut viser spécifiquement à améliorer l'équité en opérant des permutations ciblées.

## 5. Itération et Amélioration Continue

- L'algorithme de génération n'est pas statique. Il peut être affiné avec le temps en fonction des retours des utilisateurs et de l'analyse des plannings générés.
- Des fonctionnalités de **simulation** permettant de tester l'impact de nouvelles règles ou de modifications de l'algorithme sur des données réelles sont précieuses.
- Le **Machine Learning** (mentionné dans certains documents sources) pourrait, à terme, être exploré pour : 
    - Apprendre des ajustements manuels faits par les planificateurs pour suggérer de meilleures solutions initiales.
    - Prédire les risques de conflits ou les points de friction dans un planning.
    - Optimiser dynamiquement certains paramètres de l'algorithme lui-même.
    Cependant, l'intégration du ML est un projet complexe en soi.

## 6. Transparence de l'Algorithme

Même si les détails internes sont complexes, il est important que le système puisse fournir des explications (même simplifiées) sur pourquoi certaines décisions ont été prises, ou pourquoi un besoin n'a pas pu être couvert. Des **journaux de génération** et des **indicateurs de violations de règles** sont essentiels pour cela.

Le choix et l'implémentation fine de ces algorithmes sont au cœur de la valeur ajoutée de Mathildanesth. 