# 8. Reporting et Statistiques

L'application fournira des outils de reporting pour suivre l'activité, l'équité et d'autres indicateurs clés.

## 8.1 Indicateurs Clés

Les rapports suivants (liste non exhaustive) devront être disponibles :

*   **Suivi de l'Équité MAR :**
    *   Tableau récapitulatif par MAR (sur période sélectionnable : mois, trimestre, année, pluriannuel) :
        *   Nombre de gardes (total, semaine, WE, férié, vendredi).
        *   Nombre d'astreintes.
        *   Nombre de consultations (total, matin, aprem, vendredi aprem).
        *   Nombre de demi-journées de bloc (total, vendredi aprem).
        *   Nombre de demi-journées par spécialité chirurgicale supervisée/anesthésiée.
        *   Nombre de jours de week-end travaillés (Vendredi, Samedi, Dimanche séparément).
        *   **Valeurs brutes et valeurs proratisées au temps de travail.**
        *   Écart par rapport à la moyenne/cible (si définie).
*   **Suivi de l'Équité IADE :**
    *   Tableau récapitulatif par IADE (sur période sélectionnable) :
        *   Nombre de demi-journées par spécialité.
        *   Nombre de fermetures (total, vendredi).
        *   Compteur de congés payés posés/restants (nécessite le solde initial).
        *   Heures travaillées (si suivi).
        *   **Valeurs brutes et valeurs proratisées au temps de travail.**
*   **Activité du Bloc :**
    *   **Taux d'absence chirurgien :** Pourcentage de vacations où le chirurgien prévu était absent (nécessite saisie ou import de cette information).
    *   Nombre d'affectations par secteur / salle / spécialité.
    *   Nombre d'heures d'anesthésie / supervision par MAR/IADE.
*   **Suivi des Congés :**
    *   Nombre de jours de congés posés par type / par utilisateur / par période.
    *   Visualisation des périodes de faible/forte demande de congés.

## 8.2 Fonctionnalités de Reporting

*   **Tableaux de Bord :** Une vue synthétique des indicateurs clés pour les administrateurs.
*   **Filtres :** Possibilité de filtrer les rapports par période, par rôle, par utilisateur, par site/secteur.
*   **Exports :** Possibilité d'exporter les données des rapports (CSV, potentiellement graphiques en PNG/PDF).
*   **Visualisations :** Utilisation de graphiques (barres, lignes, camemberts) pour une meilleure compréhension des tendances.

## 8.3 Implémentation Technique

*   Les données seront principalement issues des tables `assignments`, `leaves`, `user_counters`, `surgeon_schedule_entries` (pour absences chir).
*   Des agrégations et calculs devront être effectués par le backend (via l'API ou des vues/procédures stockées en base de données).
*   La définition précise des compteurs et de leur mode de calcul (notamment la proratisation) devra être finalisée dans `docs/05_Regles_Metier/` et implémentée dans la logique de calcul des compteurs (table `user_counters` ou calcul à la volée). 