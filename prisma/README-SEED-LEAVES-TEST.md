# Seed de Congés Test - MARS et IADES

Ce script génère des congés réalistes pour les utilisateurs MARS et IADES sur la période juin-septembre 2025.

## 📋 Résumé

- **Période couverte** : Juin à Septembre 2025
- **Vacances d'été officielles** : 4 juillet - 31 août 2025
- **Utilisateurs concernés** : MARS et IADES existants dans la base
- **Statut des congés** : Approuvés par défaut par un administrateur

## 🏖️ Répartition des Congés

### MARS (Médecins Anesthésistes-Réanimateurs)
- **Charles-Edward BEGHIN** : 3 semaines été + congés juin/septembre
- **Arnaud BITNER** : 3 semaines été + congés juin/septembre  
- **Anca BRIEL** : 3 semaines été + congés juin/septembre
- **Bénédicte DEHEDIN** (temps partiel) : 3 semaines été + congés juin/septembre
- **Emmanuel GIRARD** : 3 semaines été + congés juin/septembre
- **Mustapha ELHOR** : 3 semaines été + congés juin/septembre
- **Thomas ELIE** (temps partiel) : 3 semaines été + congés juin/septembre
- **Ziad HATAHET** (temps partiel) : 3 semaines été + congés juin/septembre
- **Boris LACROIX** : 3 semaines été + congés juin/septembre
- **Olivier LAVABRE** : 3 semaines été + congés juin/septembre
- **Mathilde LOGEAY** (temps partiel) : 3 semaines été + congés juin/septembre
- **Alexandre MAILHÉ** (temps partiel) : 3 semaines été + congés juin/septembre
- **Samer NAFEH** : 3 semaines été + congés juin/septembre
- **Yann SACUTO** : 3 semaines été + congés juin/septembre

### IADES (Infirmiers Anesthésistes Diplômés d'État)
- **Alexandre LACROIX** : 3 semaines été + congés juin/septembre
- **Barbara PERREARD-LENFANT** : 3 semaines été + congés juin/septembre
- **Guillaume BORGNET** : 3 semaines été + congés juin/septembre
- **Guillaume GICQUEL** (admin partiel) : 3 semaines été + congés juin/septembre
- **Marlène LEGAY** : 3 semaines été + congés juin/septembre
- **Morgane JOMOTTE** : 3 semaines été + congés juin/septembre
- **Nathalie LAMAS** : 3 semaines été + congés juin/septembre
- **Vincent BOY** (admin partiel) : 3 semaines été + congés juin/septembre

## 📊 Types de Congés Utilisés

- **ANNUAL** : Congés annuels (vacances principales et périodes courtes)
- **RECOVERY** : Récupération de temps de travail
- **TRAINING** : Formation continue, DPC, congrès
- **SPECIAL** : Congés pour événements personnels/familiaux

## 🚀 Exécution

```bash
# Exécuter le script de seed
npm run seed:leaves-test

# Ou directement avec tsx
npx tsx ./prisma/seed-leaves-test.ts
```

## ⚙️ Fonctionnalités

### Calcul Intelligent des Jours
- Calcul automatique des jours ouvrés (lundi-vendredi)
- Exclusion des week-ends du décompte
- Métadonnées de calcul stockées en JSON

### Gestion des Doublons
- Vérification d'existence avant création
- Pas de création de doublons pour mêmes dates
- Affichage du nombre de congés créés vs ignorés

### Validation Automatique
- Congés approuvés automatiquement par un administrateur
- Date d'approbation = date d'exécution du script
- Commentaires automatiques générés

## 📈 Exemple de Sortie

```
🌱 Début du seed des congés test...
👤 Approbateur sélectionné: Vincent PERREARD

👤 Traitement des congés pour Charles-Edward BEGHIN (MAR)
   ✅ Congé créé: 2025-07-07 au 2025-07-25 (15 jours) - Vacances d'été principales
   ✅ Congé créé: 2025-06-16 au 2025-06-20 (5 jours) - Long week-end de juin
   ✅ Congé créé: 2025-09-08 au 2025-09-09 (2 jours) - Récupération

📊 Résumé:
   ✅ Congés créés: 72
   ⏭️  Congés ignorés (déjà existants): 0
   📅 Période couverte: juin - septembre 2025
   🏖️  Vacances officielles: 4 juillet - 31 août 2025
```

## 🎯 Objectif

Ce seed permet de tester de manière réaliste :
- L'affichage des congés dans le calendrier
- Les conflits de planning durant l'été
- La gestion des remplacements
- Les statistiques de congés
- L'impact sur la génération de planning

## ⚠️ Notes Importantes

- Le script peut être exécuté plusieurs fois sans créer de doublons
- Tous les congés sont créés avec le statut `APPROVED`
- Les dates sont cohérentes avec les vacances d'été françaises 2025
- La répartition respecte les 3 semaines de congés moyennes par personne 