# 10. Exigences Non Fonctionnelles

Ce document esquisse les exigences non fonctionnelles clés pour l'application MATHILDA, qui influencent l'architecture et les choix technologiques.

## 10.1 Performance

*   **Temps de Réponse UI :** Les interactions utilisateur courantes (navigation, ouverture de vues, soumission de formulaires simples) doivent être fluides, idéalement avec des temps de réponse inférieurs à 500ms.
*   **Affichage du Planning :** L'affichage initial du planning (vue semaine/mois) doit être rapide, même avec un nombre important d'utilisateurs et d'affectations (objectif < 2 secondes).
*   **Génération du Planning :** Le processus de génération automatique du planning pour une période donnée (ex: 1 mois) doit s'exécuter dans un temps raisonnable (objectif à définir, ex: < 5 minutes), potentiellement en tâche de fond. **La performance de cet algorithme devra être surveillée et potentiellement optimisée, notamment avec l'augmentation du volume de données et de la complexité des règles.**
*   **API Backend :** Les endpoints API fréquemment utilisés doivent répondre rapidement (objectif < 200ms en moyenne sous charge normale).
*   **Tests de Performance :**
    *   Mettre en place des **tests de charge** pour simuler l'utilisation concurrente par de nombreux utilisateurs et identifier les goulots d'étranglement API/BDD.
    *   Effectuer un **profiling régulier de l'algorithme de génération** sur des jeux de données variés pour identifier et optimiser les étapes coûteuses.
    *   Intégrer le **monitoring des performances** (temps de réponse API, temps de génération) en production.
*   Utilisation judicieuse du memoization (React.memo, useMemo, useCallback).
*   Virtualisation pour les listes très longues.

## 10.2 Disponibilité

*   **Objectif :** Haute disponibilité pendant les heures ouvrables (ex: 99.5%).
*   **Maintenance :** Planifier les maintenances en dehors des heures de pointe.
*   **Monitoring :** Mettre en place un monitoring de disponibilité (uptime checks).

## 10.3 Sécurité

*   Voir le document dédié `docs/02_Architecture_Technique/04_Securite.md` pour les détails sur l'authentification, l'autorisation, HTTPS, protection contre les attaques courantes (XSS, CSRF, Injection SQL via ORM).
*   Gestion sécurisée des mots de passe (hachage fort).
*   Audit régulier de sécurité (si possible).

## 10.4 Maintenabilité

*   **Code Lisible :** Respect des conventions de code (`CONTRIBUTING.md`), commentaires pertinents.
*   **Modularité :** Code organisé en modules/composants découplés.
*   **Tests Automatisés :** Couverture de tests suffisante (unitaire, intégration, E2E).
*   **Documentation Technique :** Documentation à jour (API, architecture, déploiement).

## 10.5 Scalabilité

*   L'architecture (backend/base de données) doit pouvoir supporter une augmentation du nombre d'utilisateurs et du volume de données sans dégradation majeure des performances.
*   Envisager des mécanismes de scaling horizontal pour le backend si nécessaire.

## 10.6 Ergonomie et Accessibilité

*   **Interface Intuitive :** L'interface utilisateur doit être facile à comprendre et à utiliser pour les différents profils (médecins, infirmiers, admins).
*   **Responsive Design :** L'application doit être utilisable sur différentes tailles d'écran (desktop, tablette, mobile), notamment pour la consultation du planning.
*   **Accessibilité (WCAG) :** Viser un niveau de conformité raisonnable aux règles d'accessibilité web (contrastes, navigation clavier, compatibilité lecteurs d'écran), bien que ce ne soit pas l'objectif prioritaire initial.

## 10.7 Adaptabilité / Configurabilité

*   Comme mentionné dans les règles métier, de nombreux paramètres (règles de planification, types de postes, configuration des compteurs) doivent être configurables via l'interface d'administration pour adapter l'application à différents contextes sans modification du code.

## 10.8 Compatibilité Navigateur

*   L'interface utilisateur doit être compatible avec les dernières versions des navigateurs modernes (Chrome, Firefox, Safari, Edge).

## 10.9 Accessibilité

*   Viser le niveau AA des WCAG 2.1 (contrastes de couleurs, navigation clavier, alternatives textuelles, etc.).

## 10.10 Capacité Hors-ligne (PWA)

*   **Objectif :** Permettre aux utilisateurs (MAR, IADE) de consulter leur planning publié même sans connexion internet.
*   **Fonctionnalité Principale :** Consultation du planning personnel (affectations publiées) en mode hors-ligne.
*   **Fonctionnalité Secondaire (Optionnelle) :** Mise en file d'attente des demandes de congé ou d'échange créées hors-ligne, pour envoi automatique au retour de la connexion.
*   **Technologie :** Utilisation des Progressive Web App (PWA) via Service Workers pour la mise en cache de l'application et des données planning nécessaires.
*   **Synchronisation :** Le cache doit être mis à jour automatiquement et de manière transparente lorsque l'application est en ligne.
*   **Feedback Utilisateur :** Indiquer clairement à l'utilisateur s'il est en mode hors-ligne et si les données affichées sont potentiellement périmées.

*(Voir aussi `docs/01_Specifications_Fonctionnelles/11_Non_Functional_Deliverables.md` pour les aspects techniques liés)* 