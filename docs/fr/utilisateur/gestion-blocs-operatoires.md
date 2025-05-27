# Guide d'utilisation - Gestion des blocs opératoires

## Vue d'ensemble

Ce guide explique comment gérer les affectations du bloc opératoire dans l'application Mathilda. Il couvre la création des secteurs, des salles et des affectations, ainsi que l'utilisation des trames de planning.

## Prérequis

- Avoir un compte utilisateur avec les permissions appropriées
- Connaître les sites hospitaliers disponibles dans votre établissement

## Gestion des trames de planning

Les trames de planning sont des modèles d'affectation que vous pouvez réutiliser pour automatiser la création de plannings hebdomadaires.

### Accéder au module bloc opératoire

1. Connectez-vous à l'application
2. Cliquez sur "Bloc Opératoire" dans le menu principal
3. Utilisez les onglets en haut de la page pour naviguer entre :
   - **Planning** : Vue hebdomadaire des affectations
   - **Salles** : Gestion des salles d'opération (administrateurs)
   - **Secteurs** : Gestion des secteurs opératoires (administrateurs)
   - **Modèles** : Modèles de planning réutilisables (administrateurs)
   - **Trames** : Trames d'affectation (administrateurs)

### Créer une trame

1. Sélectionnez un site dans le menu déroulant
2. Dans l'onglet "Trames", remplissez le formulaire :
   - Nom de la trame (ex: "Trame standard semaine paire")
   - Description (optionnel)
   - Date de début
3. Cliquez sur "Créer la trame"

### Créer un secteur et une salle

Avant de créer des affectations, vous devez disposer d'au moins un secteur et une salle d'opération :

1. Dans l'onglet "Secteurs & Salles", cliquez sur "Créer un secteur et une salle par défaut"
2. Une fois créés, ils apparaîtront dans la liste des secteurs et salles

## Planification hebdomadaire

### Générer un planning à partir d'une trame

1. Dans la liste des trames existantes, cliquez sur "Générer planning" à côté de la trame souhaitée
2. Le système créera automatiquement les plannings pour la semaine courante
3. Vous serez redirigé vers la page du planning hebdomadaire pour visualiser le résultat

### Filtrer le planning par site

Le planning hebdomadaire peut être filtré par site :

1. Accédez à la page du planning hebdomadaire
2. Utilisez le menu déroulant "Site" pour sélectionner un site spécifique
3. Le planning affichera uniquement les salles et affectations correspondant au site sélectionné

## Troubleshooting

### Aucune salle n'apparaît dans le planning

Si aucune salle n'apparaît dans le planning hebdomadaire :

1. Vérifiez que vous avez créé au moins un secteur et une salle pour le site sélectionné
2. Assurez-vous que le site sélectionné dans le filtre correspond bien au site où vous avez créé des salles
3. Vérifiez que vous avez généré un planning à partir d'une trame

### Erreur lors de la création d'affectations

Si vous rencontrez des erreurs lors de la création d'affectations :

1. Vérifiez que tous les champs obligatoires sont remplis
2. Assurez-vous que le secteur opératoire choisi existe et est associé au bon site
3. Si le problème persiste, consultez les logs de l'application pour plus de détails 