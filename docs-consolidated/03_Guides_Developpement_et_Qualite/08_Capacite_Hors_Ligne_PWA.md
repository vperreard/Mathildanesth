# Capacité Hors-Ligne (Progressive Web App - PWA)

Offrir une certaine capacité de fonctionnement en mode hors-ligne peut grandement améliorer l'expérience utilisateur de Mathildanesth, en particulier pour le personnel médical qui peut avoir besoin de consulter son planning dans des zones avec une connectivité réseau limitée ou inexistante (ex: certaines zones de l'hôpital, en déplacement).

L'approche privilégiée pour cela est de développer Mathildanesth comme une **Progressive Web App (PWA)**.

## 1. Objectifs de la Capacité Hors-Ligne

- **Consultation du Planning Personnel** : Permettre aux utilisateurs (principalement MAR, IADE) de consulter leur planning d'affectations déjà publié, même en l'absence de connexion internet.
- **Amélioration de la Résilience** : L'application reste partiellement utilisable même en cas de coupures réseau intermittentes.
- **Expérience Utilisateur Améliorée** : Accès plus rapide aux données fréquemment consultées grâce à la mise en cache locale.

## 2. Fonctionnalités Hors-Ligne Cibles

### 2.1. Fonctionnalité Principale (Essentielle)
- **Consultation du Planning Personnel Publié** :
    - Les affectations, congés, et autres événements du planning personnel de l'utilisateur, une fois téléchargés et mis en cache, doivent être consultables hors-ligne.
    - La vue calendaire personnelle devrait fonctionner en mode dégradé mais lisible.

### 2.2. Fonctionnalités Secondaires (Optionnelles, à évaluer)
- **Mise en File d'Attente des Actions** :
    - **Demandes de Congé** : Permettre à un utilisateur de préparer une demande de congé hors-ligne. La demande serait stockée localement et envoyée automatiquement au serveur dès le retour de la connexion.
    - **Demandes d'Échange d'Affectation** : Similaire aux demandes de congé.
    - *Contrainte : Nécessite une gestion de la synchronisation et des conflits potentiels si les données serveur ont changé entre-temps.*
- **Consultation Limitée d'Autres Données** : Mise en cache de données de référence peu volumineuses et fréquemment utilisées (ex: liste des collègues du service, types d'absences).

## 3. Approche Technique : Progressive Web App (PWA)

Les PWAs utilisent des technologies web modernes pour offrir une expérience similaire à celle des applications natives. Les composants clés pour la capacité hors-ligne sont :

- **Service Workers** :
    - Scripts JavaScript exécutés en arrière-plan par le navigateur, indépendamment de la page web.
    - Agissent comme un proxy réseau programmable, interceptant les requêtes réseau.
    - Permettent de mettre en cache les ressources de l'application (assets : HTML, CSS, JS, images) et les données (API responses).
    - Gèrent la stratégie de cache (ex: Cache First, Network First, Stale-While-Revalidate).
- **Cache API (Cache Storage)** :
    - Interface de stockage pour les paires requête/réponse, gérée par le Service Worker.
- **Manifeste Web (Web App Manifest)** :
    - Fichier JSON qui décrit l'application (nom, icônes, couleurs de thème, etc.).
    - Permet à l'application d'être "installée" sur l'écran d'accueil de l'utilisateur pour un accès rapide.
- **IndexedDB** :
    - Système de base de données NoSQL côté client pour stocker des données structurées plus complexes que ce que permet la Cache API (ex: données du planning pour une consultation hors-ligne, brouillons de demandes).

## 4. Stratégie de Mise en Cache des Données Planning

- **Mise en Cache à la Première Consultation en Ligne** : Lorsque l'utilisateur consulte son planning en étant connecté, le Service Worker met en cache les données pertinentes (ex: pour la semaine/mois en cours et à venir).
- **Mise à Jour du Cache** :
    - **Stratégie "Stale-While-Revalidate"** : Servir les données du cache immédiatement pour un affichage rapide, puis mettre à jour le cache en arrière-plan depuis le réseau si une connexion est disponible. L'utilisateur verra les données mises à jour lors de la prochaine visite ou après un rafraîchissement.
    - **Mise à jour Périodique/Push (Optionnel)** : Si l'application supporte les notifications push, une notification pourrait déclencher une mise à jour du cache en arrière-plan.
- **Granularité du Cache** : Mettre en cache les données par utilisateur et par période pertinente pour éviter de surcharger le stockage local.
- **Invalidation du Cache** : Mécanismes pour invalider ou mettre à jour le cache lorsque des modifications importantes ont lieu côté serveur (ex: republication d'un planning).

## 5. Feedback Utilisateur en Mode Hors-Ligne

- **Indicateur Visuel Clair** : L'interface utilisateur doit indiquer clairement à l'utilisateur :
    - S'il est actuellement en mode hors-ligne.
    - Si les données affichées proviennent du cache et la date de leur dernière synchronisation.
    - Quelles fonctionnalités sont disponibles ou limitées en mode hors-ligne.
- **Gestion des Erreurs de Synchronisation** : Si des actions mises en file d'attente ne peuvent pas être synchronisées (ex: conflit, erreur serveur), notifier l'utilisateur et lui permettre de gérer la situation.

## 6. Considérations

- **Complexité de Développement** : L'implémentation correcte des Service Workers et des stratégies de cache peut être complexe et nécessite des tests rigoureux.
- **Gestion du Stockage Local** : Être conscient des limites de stockage du navigateur et gérer l'utilisation du cache de manière eficiente.
- **Sécurité** : Les Service Workers peuvent intercepter les requêtes. S'assurer qu'ils sont servis via HTTPS et que leur portée est correctement définie.
- **Débogage** : Le débogage des Service Workers peut être plus ardu que celui du code JavaScript traditionnel.

L'intégration des capacités PWA, en particulier pour la consultation hors-ligne du planning, apporterait une valeur ajoutée significative à Mathildanesth en termes de commodité et de résilience pour ses utilisateurs. 