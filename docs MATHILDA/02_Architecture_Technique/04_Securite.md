# Sécurité

Ce document détaille les mesures de sécurité mises en place pour protéger les données et l'intégrité de l'application MATHILDA.

## 1. Authentification et Gestion des Sessions

### 1.1 Authentification avec NextAuth.js

L'application utilise NextAuth.js, une solution complète et sécurisée pour l'authentification en React :

- **Implémentation de base :** Authentification par email/mot de passe
- **Stockage sécurisé :** Hachage des mots de passe avec bcrypt et salt unique par utilisateur
- **Protection contre les attaques par force brute :** Limitation de débit sur les tentatives de connexion
- **Jetons JWT :** Stockés dans des cookies HTTP-only sécurisés avec attributs SameSite=Strict
- **Rotation des jetons :** Renouvellement automatique pour limiter les risques de détournement de session

### 1.2 Gestion des Sessions

- **Durée de vie limitée :** Sessions configurées pour expirer après 24 heures (configurable)
- **Invalidation immédiate :** Possibilité de révoquer toutes les sessions actives d'un utilisateur
- **Déconnexion automatique :** Après une période d'inactivité (configurable)
- **Suivi des connexions :** Journalisation des connexions/déconnexions avec adresse IP et user-agent

## 2. Autorisation et Contrôle d'Accès

### 2.1 Contrôle d'Accès Basé sur les Rôles (RBAC)

- **Système de rôles hiérarchique :**
  - Super Administrateur : accès complet
  - Administrateur MAR : gestion des MARs et des plannings associés
  - Administrateur IADE : gestion des IADEs et des plannings associés
  - Utilisateur standard (MAR, IADE, chirurgien, etc.) : accès limité à leurs propres données et vues

- **Permissions granulaires :** 
  - Lecture seule
  - Modification
  - Création
  - Suppression
  - Validation/approbation

### 2.2 Mise en Œuvre

- **Vérification à deux niveaux :**
  - Côté serveur : middleware d'autorisation vérifiant les permissions avant chaque action
  - Côté client : masquage des fonctionnalités non autorisées dans l'interface utilisateur
  
- **Principe du moindre privilège :** 
  - Chaque utilisateur dispose uniquement des accès strictement nécessaires à ses fonctions
  - Élévation temporaire de privilèges possible avec justification et journalisation

## 3. Protection des Données

### 3.1 Données Sensibles

- **Chiffrement des données sensibles :** 
  - Utilisation de bibliothèques cryptographiques standards (node:crypto)
  - Chiffrement des données sensibles au repos
  
- **Classification des données :**
  - Publiques : nom, prénom, rôle
  - Restreintes : adresse email, numéro de téléphone
  - Sensibles : informations médicales (si applicables), motifs d'absences

### 3.2 HTTPS et Transport Sécurisé

- **HTTPS obligatoire :** Redirection automatique de HTTP vers HTTPS
- **Configuration TLS :** TLS 1.3 avec suites de chiffrement modernes
- **HSTS :** Strict-Transport-Security pour forcer les connexions HTTPS
- **Certificats :** Renouvellement automatique via Let's Encrypt

## 4. Protection Contre les Attaques Courantes

### 4.1 Injections

- **Protection contre les injections SQL :** 
  - Utilisation de l'ORM Prisma qui utilise des requêtes paramétrées
  - Validation stricte des entrées avant toute requête

- **Protection contre les injections NoSQL :**
  - Validation des données avant d'interagir avec la base de données
  - Sanitisation des entrées utilisateur

### 4.2 Cross-Site Scripting (XSS)

- **Content-Security-Policy (CSP) :** Restrictions sur les sources de contenu exécutable
- **Sanitisation des entrées utilisateur :** 
  - Échappement des caractères spéciaux
  - Utilisation de bibliothèques de sanitisation comme DOMPurify pour le contenu HTML
- **HttpOnly cookies :** Empêche l'accès aux cookies via JavaScript

### 4.3 Cross-Site Request Forgery (CSRF)

- **Jetons CSRF :** Générés pour chaque session
- **SameSite cookies :** Configuration SameSite=Strict ou Lax selon le contexte
- **Vérification de l'origine :** Validation des en-têtes Origin et Referer

### 4.4 Clickjacking

- **En-têtes X-Frame-Options :** Prévention de l'inclusion de l'application dans des iframes
- **En-têtes Content-Security-Policy :** Avec frame-ancestors pour un contrôle plus fin

## 5. Sécurité de l'Infrastructure

### 5.1 Environnement d'Exécution

- **Principe du moindre privilège :** Exécution avec les permissions minimales nécessaires
- **Isolation des processus :** Utilisation de conteneurs Docker avec restrictions
- **Mises à jour de sécurité :** Processus automatisé pour appliquer les correctifs

### 5.2 Base de Données

- **Accès restreint :** 
  - Pare-feu de base de données limitant les connexions à l'application uniquement
  - Authentification forte avec rotation régulière des identifiants

- **Sauvegardes chiffrées :**
  - Sauvegarde quotidienne automatisée
  - Chiffrement des sauvegardes
  - Tests réguliers de restauration

### 5.3 Logs et Audit

- **Journalisation complète :**
  - Connexions réussies et échouées
  - Actions administratives sensibles
  - Modifications de données critiques
  
- **Intégrité des logs :**
  - Horodatage précis
  - Protection contre la modification
  - Rotation avec conservation selon politique définie

## 6. Gestion des Dépendances

### 6.1 Analyse des Vulnérabilités

- **Vérification automatique :** Scan régulier des dépendances avec outils comme npm audit ou Snyk
- **Mise à jour proactive :** Processus de mise à jour des bibliothèques avec vulnérabilités connues
- **Minimisation des dépendances :** Évaluation rigoureuse de chaque nouvelle dépendance

### 6.2 Intégration Continue et Déploiement

- **Tests de sécurité automatisés :** SAST (Static Application Security Testing) intégré au pipeline CI/CD
- **Revue de code :** Vérification manuelle des modifications sensibles
- **Environnements séparés :** Isolation stricte entre développement, test et production

## 7. Plan de Réponse aux Incidents

### 7.1 Détection

- **Surveillance :** Monitoring continu des comportements anormaux
- **Alertes :** Notification immédiate en cas de tentative d'intrusion ou d'activité suspecte
- **Logs centralisés :** Analyse en temps réel des journaux d'activité

### 7.2 Réponse

- **Procédure documentée :**
  - Évaluation de l'impact
  - Confinement
  - Éradication
  - Récupération
  - Analyse post-incident
  
- **Contacts d'urgence :** Liste maintenue à jour avec responsabilités clairement définies

## 8. Conformité et Protection des Données

### 8.1 RGPD (Règlement Général sur la Protection des Données)

- **Minimisation des données :** Collecte limitée aux informations strictement nécessaires
- **Finalité explicite :** Documentation claire de l'usage des données personnelles
- **Droit à l'oubli :** Mécanisme d'effacement des données sur demande
- **Portabilité :** Export des données au format standard

### 8.2 Hébergement des Données de Santé

Si applicable, respect des réglementations spécifiques aux données de santé :

- **Hébergement certifié :** Choix d'un hébergeur conforme aux exigences légales
- **Confidentialité renforcée :** Mesures supplémentaires pour les données médicales
- **Traçabilité :** Historique complet des accès aux données sensibles

## 9. Formation et Sensibilisation

- **Documentation utilisateur :** Guide des bonnes pratiques de sécurité
- **Formation administrateur :** Procédures spécifiques pour les utilisateurs disposant de privilèges élevés
- **Sensibilisation continue :** Rappels réguliers sur la sécurité et les nouvelles menaces

## 10. Tests et Audit de Sécurité

- **Tests d'intrusion :** Évaluation périodique de la résistance face aux attaques
- **Audit de code :** Examen du code source pour identifier les vulnérabilités potentielles
- **Revue de configuration :** Vérification régulière des paramètres de sécurité 