# Foire Aux Questions (FAQ)

Cette FAQ répond aux questions courantes concernant l'utilisation et le fonctionnement de Mathildanesth.

## Questions Générales sur la Planification

**Q: Comment sont calculés les quotas (de congés, d'activités spécifiques) pour les temps partiels ?**
R: En général, les quotas sont calculés au prorata du temps de travail défini pour l'utilisateur. Par exemple, un utilisateur à 50% pourrait avoir la moitié du quota d'un utilisateur à temps plein pour un type de congé donné ou pour une activité spécifique soumise à quota.

**Q: Que se passe-t-il si aucun personnel adéquat n'est disponible pour une affectation critique (ex: une garde) ?**
R: Le système de génération de planning signalera un conflit ou une impossibilité. L'interface de planification remontera une alerte. Les planificateurs devront alors :
    -   Vérifier s'il est possible d'assouplir temporairement certaines règles (si l'application le permet et si c'est acceptable).
    -   Faire appel à du personnel de remplacement ou sur la base du volontariat.
    -   Réorganiser d'autres affectations pour libérer du personnel.

**Q: Comment fonctionne le système de suivi de la fatigue ou de la pénibilité ?**
R: Certains types d'affectations (gardes, travail de nuit, supervision intense) peuvent générer des "points" de fatigue ou de pénibilité. Ces points s'accumulent sur une période donnée. Si un seuil est atteint pour un utilisateur, le système peut :
    -   Émettre une alerte.
    -   Éviter de lui attribuer des affectations particulièrement lourdes.
    -   Le prioriser pour des périodes de repos ou des affectations plus légères.
    Les modalités exactes (calcul des points, seuils, impact) sont configurables par les administrateurs.

## Questions sur les Gardes et Astreintes

**Q: Pourquoi le système refuserait-il d'attribuer une garde à un utilisateur ?**
R: Plusieurs raisons sont possibles, en fonction des règles configurées :
    -   Non-respect du délai minimum depuis la dernière garde.
    -   Dépassement du nombre maximum de gardes sur la période (ex: mois, trimestre).
    -   Score de fatigue/pénibilité trop élevé.
    -   Congé, absence ou indisponibilité déclarée sur la période.
    -   Non-respect d'une règle de compétence ou de secteur.

**Q: Comment sont gérés les week-ends prolongés ou les jours fériés ?**
R: Les jours fériés sont définis dans le système. Les affectations sur ces jours ou les week-ends incluant un jour férié peuvent avoir une pondération différente dans les compteurs d'équité (ex: comptés comme un "super week-end") pour assurer une répartition équitable de ces périodes plus contraignantes.

## Questions sur les Consultations ou Autres Activités Hors Bloc

**Q: Peut-on limiter le nombre de consultations (ou autre activité spécifique) par semaine pour un utilisateur ?**
R: Oui, cela fait généralement partie des règles de planification configurables. Des seuils minimum et maximum par période peuvent être définis, souvent en lien avec le temps de travail de l'utilisateur.

**Q: Comment indiquer qu'un créneau de consultation (ou autre activité) est fermé ?**
R: Les planificateurs ou administrateurs peuvent généralement indiquer des fermetures de créneaux ou de salles via l'interface de gestion du planning ou la configuration des ressources. Cela empêchera l'attribution de personnel à ces créneaux.

## Questions sur le Bloc Opératoire

**Q: Que signifie "supervision exceptionnelle" ou une alerte de ratio de supervision ?**
R: Cela indique qu'un Médecin Anesthésiste-Réanimateur (MAR) supervise plus de salles ou d'Infirmiers Anesthésistes (IADE) que ce qui est habituellement recommandé ou autorisé par les règles standard. Cette situation peut générer une alerte et potentiellement affecter les compteurs de pénibilité.

**Q: Les règles de planification peuvent-elles varier par secteur du bloc opératoire ?**
R: Oui, Mathildanesth est conçu pour permettre la configuration de règles spécifiques par secteur (ex: ratios de supervision différents, compétences requises spécifiques) pour s'adapter aux particularités de chaque type de chirurgie ou d'organisation.

## Questions Techniques et Dépannage

**Q: L'application semble lente lors de la génération du planning. Que faire ?**
R: Plusieurs facteurs peuvent influencer la performance :
    -   La complexité des règles configurées.
    -   Le nombre d'utilisateurs et d'affectations à traiter.
    -   La longueur de la période de planification.
    -   L'infrastructure serveur.
    Si vous êtes administrateur, vous pouvez vérifier les logs serveur pour des erreurs. Il est parfois possible d'optimiser certaines règles ou de réduire la période de génération pour améliorer les temps de réponse. Contactez le support technique si le problème persiste.

**Q: J'ai un message d'erreur "Règles en conflit" ou "Impossible de générer le planning".**
R: Cela signifie que le système n'a pas pu trouver de solution satisfaisant toutes les règles dures (inviolables).
    -   Vérifiez les disponibilités du personnel (congés, sureffectif d'absences).
    -   Examinez les règles récemment modifiées qui pourraient être trop contraignantes.
    -   L'application peut proposer des outils de diagnostic pour identifier les règles spécifiques en conflit.
    -   Il peut être nécessaire de désactiver temporairement certaines règles moins critiques ou d'ajuster manuellement les besoins ou les disponibilités.

**Q: Où puis-je trouver plus d'informations ou de l'aide ?**
R:
    -   Consultez les autres sections de cette documentation consolidée.
    -   Utilisez les [Guides Utilisateur](./) (Prise en Main Rapide, Guide Administrateur, Guide Planificateur).
    -   Si votre instance de Mathildanesth dispose d'une section d'aide intégrée, explorez-la.
    -   Contactez votre administrateur référent ou le support technique désigné pour votre organisation. 