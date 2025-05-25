# Aspects Techniques de la Validation des Dates de Congés

## 1. Introduction

La validation des dates pour les demandes de congés est une étape cruciale pour assurer la cohérence des données et le respect des règles métier. Ce document détaille les aspects techniques de cette validation, en s'appuyant notamment sur les hooks et services implémentés dans `mathildanesth`.

## 2. Hooks et Services Impliqués

La logique de validation des dates est principalement encapsulée dans les hooks suivants :

- **`useDateValidation.ts`** : Ce hook semble être central pour la validation des dates. Il est mentionné dans `docs/technique/NEXT_STEPS.md` comme ayant été corrigé pour son alignement avec `useErrorHandler` et pour la signature de ses props d'erreur. Il est probable qu'il contienne la logique de base pour vérifier la validité intrinsèque des dates (cohérence début/fin, format, etc.) et potentiellement des règles simples.

- **`useLeaveConflictNotification.ts`** : Selon `docs/technical/codebase-overview.md`, ce hook, qui s'intègre avec `useConflictDetection.ts`, inclut une fonction `validateDates(startDate: Date | null, endDate: Date | null): boolean`. Cela suggère qu'il étend la validation pour prendre en compte des aspects liés aux conflits ou des règles métier plus complexes qui ne relèvent pas uniquement de la validité calendaire.

- **`useConflictDetection.ts`** : Bien que son rôle principal soit la détection de conflits, il interagit étroitement avec la validation des dates, car une date invalide ou une période mal définie ne permettrait pas une détection de conflits fiable.

- **`useLeaveQuota.ts`**: Mentionné dans `documentation/roadmap-dev-updated.md` comme ayant des tests corrigés. Bien que focalisé sur les quotas, il doit nécessairement opérer sur des périodes de dates valides pour calculer correctement les jours décomptés.

## 3. Types de Validations Effectuées

La validation des dates couvre plusieurs aspects :

### 3.1. Validation Intrinsèque des Dates

- **Format et Validité Calendaire** : S'assurer que les dates fournies sont des dates réelles et dans un format attendu.
- **Cohérence Chronologique** : La date de fin ne peut pas être antérieure à la date de début.
- **Durée Minimale/Maximale** : Certaines règles peuvent imposer une durée minimale ou maximale pour un type de congé spécifique.
- **Dates Passées/Futures** : Interdiction de soumettre des demandes pour des dates déjà passées (sauf cas exceptionnels configurés) ou trop lointaines dans le futur.

### 3.2. Validation par Rapport aux Règles Métier

- **Jours Ouvrables/Fériés** : Prise en compte des jours ouvrables et des jours fériés pour le calcul des jours décomptés et pour certaines règles (ex: interdiction de poser un congé la veille d'un jour férié pour certains rôles).
  - Le bug #253 mentionné dans `docs/technique/NEXT_STEPS.md` concerne spécifiquement le calcul des jours ouvrables et fériés.
- **Périodes de Restriction (Blackout Periods)** : Le système peut définir des périodes pendant lesquelles certains types de congés (ou tous) ne sont pas autorisés (ex: périodes de forte activité).
  - La logique `blackoutPeriods` a été ajoutée à `useDateValidation.test.ts` (`documentation/roadmap-dev-updated.md`), indiquant son implémentation.
- **Préavis Minimum** : Certains types de congés peuvent nécessiter un délai de préavis minimum avant la date de début.
- **Chevauchement avec des Affectations Critiques** : Vérification si la période de congé demandée entre en conflit avec des gardes ou des affectations critiques déjà planifiées pour l'utilisateur.

### 3.3. Validation par Rapport aux Quotas et Soldes

- Vérification si l'utilisateur dispose d'un solde suffisant pour le type de congé demandé et la durée.

### 3.4. Validation par Rapport aux Conflits (via `useConflictDetection`)

- Bien que distincte, la validation des dates est une condition préalable à la détection des conflits. Si les dates sont invalides, la détection de conflits ne peut pas s'exécuter correctement.

## 4. Mécanisme de Retour d'Erreur

- En cas d'échec de validation, le système doit fournir un retour clair à l'utilisateur, expliquant la raison de l'échec.
- Le hook `useDateValidation.ts` a été aligné avec `useErrorHandler` (`docs/technique/NEXT_STEPS.md`), ce qui suggère une gestion structurée des erreurs et un affichage cohérent des messages.
- Les props d'erreur du hook ont également été corrigées, permettant de remonter des informations précises sur les erreurs de validation.

## 5. Points d'Attention et Évolutions

- **Centralisation de la Logique** : La roadmap (`documentation/roadmap-dev-updated.md`) mentionne la "Mise en place/Refactorisation d'un système de validation des dates robuste et centralisé" comme une tâche P1 complétée. Cela indique une volonté de consolider cette logique pour éviter la duplication et assurer la cohérence.
- **Tests Exhaustifs** : Des tests unitaires et d'intégration sont essentiels pour couvrir tous les scénarios de validation, y compris les cas limites et les interactions entre différentes règles.
  - `useDateValidation.test.ts` a 58 tests qui passent (`documentation/roadmap-dev-updated.md`), ce qui est un bon signe.
- **Configurabilité** : Idéalement, de nombreuses règles de validation (durées min/max, préavis, blackout periods) devraient être configurables par les administrateurs plutôt qu'être codées en dur.

---

Ce document résume les aspects techniques de la validation des dates. Une compréhension approfondie du code des hooks mentionnés est nécessaire pour des détails d'implémentation plus précis.
