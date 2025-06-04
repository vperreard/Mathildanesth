# Guide de Résolution des Problèmes : Simulateur de Planning et Moteur de Règles

Ce guide vous aidera à diagnostiquer et résoudre les problèmes les plus fréquemment rencontrés lors de l'utilisation du simulateur de planning et du moteur de règles.

## Table des matières

1. [Problèmes liés aux violations de règles](#problèmes-liés-aux-violations-de-règles)
2. [Problèmes d'équité et de répartition](#problèmes-déquité-et-de-répartition)
3. [Problèmes de performance et d'optimisation](#problèmes-de-performance-et-doptimisation)
4. [Problèmes liés aux préférences et contraintes](#problèmes-liés-aux-préférences-et-contraintes)
5. [Problèmes techniques et bugs](#problèmes-techniques-et-bugs)
6. [Questions fréquentes](#questions-fréquentes)

## Problèmes liés aux violations de règles

### Violation critique : "CONSECUTIVE_SHIFTS"

**Symptômes** : Le simulateur génère un planning avec des gardes consécutives pour certains médecins sans période de repos suffisante.

**Causes possibles** :
- Paramètres d'intervalles trop courts
- Effectif insuffisant pour la période
- Contraintes contradictoires

**Solutions** :
1. **Augmenter les paramètres d'intervalle** :
   ```json
   "reglesConfiguration": {
     "intervalle": {
       "minJoursEntreGardes": 10,  // Augmenter cette valeur
       "eviterConsecutifs": true
     }
   }
   ```

2. **Activer l'option de récupération obligatoire** :
   ```json
   "reglesConfiguration": {
     "qualiteVie": {
       "recuperationApresGardeNuit": true
     }
   }
   ```

3. **Assouplir temporairement certaines contraintes** :
   - Réduire le poids des préférences personnelles
   - Permettre exceptionnellement certaines affectations inhabituelles
   - Ajouter du personnel temporaire

### Violation critique : "FATIGUE_LIMIT"

**Symptômes** : Le score de fatigue de certains personnels dépasse le seuil critique.

**Causes possibles** :
- Accumulation d'affectations lourdes sur une courte période
- Taux de récupération insuffisant
- Seuils de fatigue mal configurés

**Solutions** :
1. **Ajuster la configuration de fatigue** :
   ```json
   "fatigueConfig": {
     "points": {
       "garde": 40,
       "astreinte": 15,
       "supervisionMultiple": 15
     },
     "tauxRecuperation": 15,  // Augmenter pour une récupération plus rapide
     "seuilAlerte": 70,
     "seuilCritique": 90      // Augmenter temporairement si nécessaire
   }
   ```

2. **Forcer des périodes de repos** :
   - Ajouter des contraintes de repos obligatoire
   - Verrouiller certains jours comme "OFF" pour le personnel critique
   - Activer l'option `"minimiserFatigue": true`

3. **Répartir les charges lourdes** :
   - Identifier les affectations à forte charge (pédiatrie, supervisions multiples)
   - Distribuer équitablement ces charges entre le personnel
   - Alterner les types d'affectations pour un même médecin

### Violation majeure : "EQUITY_VIOLATION"

**Symptômes** : Déséquilibre significatif dans la répartition des gardes.

**Causes possibles** :
- Poids d'équité trop faible
- Contraintes personnelles trop restrictives
- Historique des gardes mal initialisé

**Solutions** :
1. **Augmenter l'importance de l'équité** :
   ```json
   "poidsEquite": 0.8,
   "reglesConfiguration": {
     "equite": {
       "poidsGardesWeekend": 2.0,
       "poidsGardesFeries": 2.5
     }
   }
   ```

2. **Vérifier les compteurs historiques** :
   - Accéder à la section "Compteurs" du système
   - Vérifier que les gardes antérieures sont correctement comptabilisées
   - Ajuster manuellement si nécessaire pour refléter la réalité

3. **Activer le rééquilibrage forcé** :
   ```json
   "optimisationSpeciale": {
     "reequilibrageForce": true,
     "prioriteEquite": true
   }
   ```

### Violation mineure : "PREFERENCE_NOT_RESPECTED"

**Symptômes** : Les préférences personnelles sont ignorées pour certaines affectations.

**Causes possibles** :
- Poids des préférences trop faible
- Contraintes conflictuelles
- Préférences incompatibles avec d'autres règles prioritaires

**Solutions** :
1. **Augmenter le poids des préférences** :
   ```json
   "poidsPreference": 0.7,
   "reglesConfiguration": {
     "qualiteVie": {
       "poidsPreferences": 0.8
     }
   }
   ```

2. **Identifier et résoudre les conflits** :
   - Utiliser l'outil d'analyse des conflits pour voir quelles règles sont en contradiction
   - Établir clairement la priorité entre règles conflictuelles
   - Documenter les compromis nécessaires

3. **Appliquer un planning semi-automatique** :
   - Générer le planning avec une priorité moyenne pour les préférences
   - Identifier les principales violations
   - Ajuster manuellement les cas problématiques

## Problèmes d'équité et de répartition

### Déséquilibre persistant des gardes de weekend

**Symptômes** : Certains membres de l'équipe ont systématiquement plus de gardes de weekend que d'autres.

**Causes possibles** :
- Poids insuffisant pour les gardes de weekend
- Contraintes personnelles créant des blocages
- Historique des gardes mal pris en compte

**Solutions** :
1. **Augmenter le poids des gardes de weekend** :
   ```json
   "reglesConfiguration": {
     "equite": {
       "poidsGardesWeekend": 2.5,  // Valeur standard : 1.5
     }
   }
   ```

2. **Analyser les contraintes personnelles** :
   - Identifier qui a des contraintes de weekend
   - Vérifier si ces contraintes créent un déséquilibre structurel
   - Discuter de possibles assouplissements ou rotations

3. **Établir un système de rotation explicite** :
   - Définir un calendrier de rotation pour les weekends sur plusieurs mois
   - Intégrer cette rotation comme contrainte forte dans le système
   - Documenter et communiquer clairement cette organisation

### Charge inégale des spécialités difficiles

**Symptômes** : Certains médecins sont systématiquement affectés aux spécialités les plus exigeantes.

**Causes possibles** :
- Configuration incomplète des compétences
- Règle d'équilibrage des spécialités non activée
- Manque de personnel qualifié pour certaines spécialités

**Solutions** :
1. **Activer l'équilibrage par spécialités** :
   ```json
   "reglesConfiguration": {
     "equite": {
       "equilibrageSpecialites": true
     }
   }
   ```

2. **Vérifier la matrice des compétences** :
   - S'assurer que les compétences de chaque membre sont correctement enregistrées
   - Identifier les spécialités avec peu de personnel qualifié
   - Planifier des formations pour élargir la base de compétences

3. **Intégrer une compensation** :
   - Définir un système de points ou de compensation pour les spécialités difficiles
   - Réduire la charge sur d'autres aspects pour ceux qui prennent plus de spécialités exigeantes
   - Documenter cette compensation pour la transparence

### Nouveaux membres surreprésentés dans les affectations difficiles

**Symptômes** : Les nouveaux membres reçoivent proportionnellement plus de gardes ou d'affectations difficiles.

**Causes possibles** :
- Compteurs initialisés à zéro sans tenir compte de l'équité globale
- Absence de règles spécifiques pour l'intégration progressive
- Biais de l'algorithme favorisant les compteurs bas

**Solutions** :
1. **Configurer l'intégration progressive** :
   ```json
   "reglesSpeciales": {
     "nouveauxMembres": {
       "actif": true,
       "progressionGardeMois1": 1,
       "progressionGardeMois2": 2,
       "progressionGardeMois3": 3
     }
   }
   ```

2. **Initialiser correctement les compteurs** :
   - Pour un nouveau membre, initialiser les compteurs à la moyenne de l'équipe
   - Ou définir une valeur médiane pour éviter les extrêmes
   - Documenter cette politique d'initialisation

3. **Supervision et mentorat** :
   - Activer l'option de supervision obligatoire
   - Prévoir du temps de chevauchement pour la formation
   - Éviter d'affecter deux nouveaux membres ensemble sur des postes critiques

## Problèmes de performance et d'optimisation

### Temps de génération excessivement long

**Symptômes** : Le simulateur prend plusieurs minutes, voire des heures pour générer un planning.

**Causes possibles** :
- Période trop longue
- Trop de contraintes actives simultanément
- Niveau d'optimisation excessif par rapport aux besoins

**Solutions** :
1. **Réduire la période de génération** :
   - Générer par trimestre plutôt que par semestre
   - Ou adopter une approche incrémentale mois par mois

2. **Ajuster le niveau d'optimisation** :
   ```json
   "niveauOptimisation": "standard",  // Au lieu de "approfondi"
   ```

3. **Optimiser par couches successives** :
   - Générer d'abord les gardes et astreintes
   - Verrouiller ces affectations
   - Générer ensuite les consultations et bloc opératoire
   - Cette approche réduit considérablement la complexité computationnelle

4. **Réduire le nombre de règles actives** :
   - Identifier les règles non essentielles
   - Désactiver temporairement les règles de moindre importance
   - Réactiver progressivement selon les besoins

### Résultats de qualité insuffisante avec optimisation rapide

**Symptômes** : Le mode d'optimisation "rapide" produit des plannings de qualité insuffisante avec de nombreuses violations.

**Causes possibles** :
- Complexité élevée des contraintes
- Paramètres d'optimisation inadaptés
- Conflits non résolus entre règles

**Solutions** :
1. **Utiliser une approche hybride** :
   - Commencer avec une optimisation "standard"
   - Identifier les problèmes majeurs
   - Passer en "approfondi" seulement pour résoudre ces problèmes

2. **Augmenter les itérations du mode rapide** :
   ```json
   "optimisationParams": {
     "maxIterations": 5000,  // Valeur standard : 1000
     "seuilAmelioration": 0.01
   }
   ```

3. **Simplifier temporairement le problème** :
   - Réduire le nombre de contraintes
   - Se concentrer sur les règles critiques uniquement
   - Réintroduire progressivement les contraintes de moindre importance

### Instabilité des résultats entre simulations

**Symptômes** : Des exécutions successives avec les mêmes paramètres produisent des résultats très différents.

**Causes possibles** :
- Composante aléatoire trop importante
- Optimum local plutôt que global
- Conflits non résolus entre règles

**Solutions** :
1. **Fixer une seed pour la reproductibilité** :
   ```json
   "seed": 42,  // N'importe quelle valeur fixe
   ```

2. **Augmenter le nombre d'itérations** :
   ```json
   "optimisationParams": {
     "maxIterations": 10000,
     "minIterationsSansMeliorations": 1000
   }
   ```

3. **Utiliser plusieurs points de départ** :
   - Générer plusieurs simulations avec des seeds différentes
   - Comparer les résultats
   - Sélectionner la meilleure solution

## Problèmes liés aux préférences et contraintes

### Préférences contradictoires entre membres

**Symptômes** : Impossibilité de satisfaire toutes les préférences, même avec un poids élevé.

**Causes possibles** :
- Préférences mutuellement exclusives pour les mêmes dates
- Trop de contraintes fortes sur les mêmes périodes
- Absence de mécanisme de priorité entre préférences

**Solutions** :
1. **Établir un système de priorité** :
   - Distinguer les préférences "fortes" (non négociables) des "souhaits" (flexibles)
   - Limiter le nombre de préférences fortes par personne et par période
   - Permettre aux membres d'indiquer leurs préférences par ordre d'importance

2. **Implémentation technique** :
   ```json
   "preferencesSettings": {
     "maxPreferencesFortesParMois": 3,
     "maxPreferencesNormalesParMois": 10,
     "poidsPreferencesFortes": 0.9,
     "poidsPreferencesNormales": 0.6
   }
   ```

3. **Rotation des priorités** :
   - Établir un système où les priorités changent à chaque période
   - Documenter clairement qui a la priorité pour chaque période spéciale (Noël, etc.)
   - Assurer une traçabilité des priorités passées pour l'équité à long terme

### Contraintes individuelles créant des déséquilibres structurels

**Symptômes** : Certaines contraintes personnelles rendent impossible une répartition équitable.

**Causes possibles** :
- Contraintes permanentes trop restrictives
- Contraintes temporaires non enregistrées comme telles
- Accumulation de petites contraintes créant un effet majeur

**Solutions** :
1. **Audit des contraintes** :
   - Analyser l'ensemble des contraintes individuelles
   - Identifier celles qui ont le plus d'impact sur l'équité
   - Quantifier l'impact de chaque contrainte sur l'équité globale

2. **Négociation et adaptation** :
   - Discuter des contraintes les plus problématiques
   - Envisager des assouplissements partiels ou temporaires
   - Proposer des alternatives acceptables

3. **Compensation transparente** :
   - Pour les contraintes inévitables, mettre en place un système de compensation
   - Documenter clairement cette compensation
   - Assurer que la charge totale reste équitable malgré des répartitions différentes

### Préférences non prises en compte malgré un poids élevé

**Symptômes** : Certaines préférences sont systématiquement ignorées malgré une configuration les favorisant.

**Causes possibles** :
- Conflit avec des règles de priorité supérieure
- Préférences mal enregistrées ou au mauvais format
- Bug dans l'algorithme de prise en compte des préférences

**Solutions** :
1. **Vérifier la saisie des préférences** :
   - Consulter la liste complète des préférences enregistrées
   - Vérifier leur format et leur période d'application
   - Corriger les erreurs éventuelles

2. **Identifier les conflits de règles** :
   - Utiliser l'outil d'analyse des conflits
   - Identifier les règles qui prennent le pas sur les préférences
   - Ajuster leur priorité relative si nécessaire

3. **Test ciblé** :
   - Créer une simulation avec uniquement les préférences comme règles
   - Vérifier si elles sont alors respectées
   - Si oui, réintroduire progressivement les autres règles pour identifier le conflit

## Problèmes techniques et bugs

### Échec de la génération du planning

**Symptômes** : Le simulateur échoue avec un message d'erreur ou reste bloqué.

**Causes possibles** :
- Contraintes contradictoires rendant le problème insoluble
- Problème de mémoire ou de performance
- Bug dans l'algorithme

**Solutions** :
1. **Simplifier le problème** :
   - Réduire la période de génération
   - Désactiver les règles non essentielles
   - Utiliser le niveau d'optimisation "rapide"

2. **Vérifier les contraintes** :
   - Chercher des contraintes contradictoires manifestes
   - Assouplir temporairement les contraintes les plus strictes
   - Générer avec un minimum de contraintes pour identifier la problématique

3. **Redémarrer le service** :
   - Rafraîchir la page
   - Vider le cache du navigateur
   - Si nécessaire, contacter le support technique

### Incohérences dans les métriques affichées

**Symptômes** : Les métriques (équité, fatigue, etc.) ne semblent pas correspondre au planning généré.

**Causes possibles** :
- Bug dans le calcul des métriques
- Données d'entrée incorrectes
- Asynchronisme entre génération et calcul des métriques

**Solutions** :
1. **Vérifier les données d'entrée** :
   - Contrôler les compteurs historiques
   - Vérifier les paramètres de calcul des métriques
   - S'assurer que toutes les affectations sont prises en compte

2. **Recalculer manuellement** :
   - Utiliser l'outil de recalcul des métriques
   - Comparer avec les valeurs affichées
   - Signaler les différences significatives

3. **Test avec des données simples** :
   - Créer un scénario de test simple avec des valeurs prévisibles
   - Vérifier que les métriques correspondent aux attentes
   - Si nécessaire, signaler un bug précis

### Problèmes d'affichage ou d'interface

**Symptômes** : Éléments d'interface manquants, affichage incorrect, boutons non fonctionnels.

**Causes possibles** :
- Problèmes de compatibilité navigateur
- Cache obsolète
- Bugs d'interface

**Solutions** :
1. **Rafraîchir et nettoyer** :
   - Actualiser la page (Ctrl+F5)
   - Vider le cache du navigateur
   - Essayer avec un autre navigateur

2. **Vérifier la compatibilité** :
   - S'assurer d'utiliser un navigateur supporté (Chrome, Firefox, Edge récents)
   - Vérifier que JavaScript est activé
   - Désactiver les extensions qui pourraient interférer

3. **Signaler le problème** :
   - Faire une capture d'écran du problème
   - Noter les étapes précises pour le reproduire
   - Transmettre ces informations au support technique

## Questions fréquentes

### Comment optimiser la génération pour une petite équipe (<10 personnes) ?

Pour les petites équipes, la principale difficulté est de respecter les contraintes de repos tout en assurant une couverture complète. Voici les ajustements recommandés :

1. **Réduire les intervalles minimums** :
   ```json
   "reglesConfiguration": {
     "intervalle": {
       "minJoursEntreGardes": 5,    // Au lieu de 7
       "minJoursRecommandes": 14    // Au lieu de 21
     }
   }
   ```

2. **Augmenter les limites de gardes** :
   ```json
   "reglesConfiguration": {
     "intervalle": {
       "maxGardesMois": 4    // Au lieu de 3
     }
   }
   ```

3. **Privilégier la qualité de vie** :
   ```json
   "poidsQualiteVie": 0.8,   // Valeur haute
   "reglesConfiguration": {
     "qualiteVie": {
       "recuperationApresGardeNuit": true
     }
   }
   ```

### Comment gérer efficacement les périodes de vacances scolaires ?

Les vacances scolaires créent souvent des pics de demandes de congés, rendant la planification plus complexe :

1. **Anticiper avec des préréglages spécifiques** :
   ```json
   "poidsPreference": 0.8,      // Valeur élevée
   "poidsEquite": 0.4,          // Valeur réduite
   "appliquerPreferencesPersonnelles": true
   ```

2. **Établir un système de rotation prioritaire** :
   - Diviser l'année en périodes de vacances
   - Attribuer des priorités différentes à chaque membre pour chaque période
   - Documenter clairement ces priorités pour l'équité à long terme

3. **Planification anticipée** :
   - Générer les plannings des vacances 3-4 mois à l'avance
   - Verrouiller les congés accordés avant de générer le reste
   - Prévoir une flexibilité pour les ajustements mineurs

### Comment intégrer efficacement de nouveaux membres dans les plannings ?

L'intégration des nouveaux membres nécessite un équilibre entre formation, équité et montée en charge progressive :

1. **Configuration progressive** :
   ```json
   "reglesSpeciales": {
     "nouveauxMembres": {
       "actif": true,
       "progressionGardeMois1": 1,   // 1 garde le premier mois
       "progressionGardeMois2": 2,   // 2 gardes le deuxième mois
       "progressionGardeMois3": 3    // Charge normale ensuite
     }
   }
   ```

2. **Supervision obligatoire** :
   ```json
   "reglesSpeciales": {
     "nouveauxMembres": {
       "supervisonObligatoire": true,
       "dureeSupervisonObligatoire": 3   // En mois
     }
   }
   ```

3. **Compétences progressives** :
   - Commencer par les spécialités de base
   - Élargir progressivement aux spécialités plus complexes
   - Documenter la progression des compétences

### Comment trouver le bon équilibre entre équité et préférences ?

Cette question revient constamment et nécessite une approche nuancée :

1. **Approche suggérée** :
   ```json
   "poidsEquite": 0.6,
   "poidsPreference": 0.6,
   "poidsQualiteVie": 0.5
   ```

2. **Adaptation contextuelle** :
   - Pour les périodes normales : légère préférence pour l'équité
   - Pour les périodes spéciales (fêtes, vacances) : préférence pour les souhaits personnels
   - Après des déséquilibres : priorité temporaire à l'équité pour rééquilibrer

3. **Transparence et communication** :
   - Afficher clairement les scores d'équité
   - Communiquer les choix de priorité
   - Recueillir régulièrement le feedback de l'équipe sur cet équilibre
</rewritten_file> 