# 📱 STRATÉGIE DE TESTS MANUELS UTILISATEUR

**Créé le**: 06/01/2025  
**Objectif**: Combiner tests manuels utilisateur + fixes automatisés

---

## 🎯 PRINCIPE

**Tests manuels FIRST, automatisation SECOND**

Au lieu de réparer des tests théoriques, on fixe les bugs RÉELS rencontrés.

---

## 📋 PROTOCOLE DE TEST MANUEL

### 🔴 PHASE 1 : Parcours Critique (30 min)
**Testeur**: Utilisateur réel (toi)  
**Environment**: Dev local (`npm run dev`)

#### Checklist Parcours Minimal
```
[ ] 1. CONNEXION
    - Page login s'affiche
    - Connexion avec credentials valides
    - Redirection après login
    - Token/session OK

[ ] 2. NAVIGATION DE BASE  
    - Menu principal fonctionne
    - Breadcrumbs corrects
    - Retour arrière OK
    - Pas de 404

[ ] 3. CONGÉS (Feature critique)
    - Liste des congés s'affiche
    - Création nouveau congé
    - Validation formulaire
    - Sauvegarde effective

[ ] 4. PLANNING (Feature critique)
    - Calendrier s'affiche
    - Drag & drop fonctionne
    - Sauvegarde modifications
    - Conflits détectés

[ ] 5. ADMIN (Si applicable)
    - Accès zones admin
    - CRUD utilisateurs
    - Paramètres sauvegardés
```

### 📝 FORMAT DE RAPPORT DE BUG

Pour CHAQUE bug rencontré :

```markdown
## BUG #X - [Titre court]
**Parcours**: Connexion > Congés > Nouveau
**Action**: Clic sur "Valider" 
**Attendu**: Modal de confirmation
**Obtenu**: Page blanche / Erreur console
**Console**: [Copier l'erreur]
**Criticité**: 🔴 Bloquant / 🟡 Majeur / 🟢 Mineur
**Screenshot**: [Si applicable]
```

---

## 🔧 PHASE 2 : Fix Collaboratif

### Pour bugs 🔴 BLOQUANTS
1. **Tu me donnes** : Le rapport de bug formaté
2. **Je diagnostique** : Root cause dans le code
3. **Je fixe** : Solution minimale
4. **Tu retestes** : Validation immédiate

### Pour bugs 🟡 MAJEURS  
- Groupés par module
- Fixes en batch
- Retest global après

### Pour bugs 🟢 MINEURS
- Documentés dans KNOWN_ISSUES.md
- Traités post-stabilisation

---

## 📊 MÉTRIQUES DE SUCCÈS

### Court terme (Jour 1-2)
- ✅ 0 bugs bloquants
- ✅ Parcours critique complet sans erreur
- ✅ Features core utilisables

### Moyen terme (Jour 3-5)
- ✅ Tests E2E sur parcours validés
- ✅ Automatisation des cas critiques
- ✅ CI/CD avec tests réels

---

## 🚀 WORKFLOW OPTIMISÉ

```
1. TEST MANUEL (Toi - 30min)
   ↓
2. RAPPORT BUGS (Format structuré)
   ↓
3. FIX PRIORITAIRE (Moi - Par criticité)
   ↓
4. RETEST IMMÉDIAT (Toi - 5min)
   ↓
5. COMMIT SI OK
   ↓
6. TEST E2E APRÈS (Automatisation du parcours validé)
```

---

## ⏰ QUAND FAIRE LES TESTS MANUELS ?

### 🔴 IMMÉDIATEMENT (Jour 1)
- **Avant** toute réparation de tests unitaires
- **Pourquoi** : Identifier les vrais problèmes
- **Durée** : 30-45 minutes max

### 🔄 APRÈS CHAQUE FIX MAJEUR
- Retest du parcours impacté
- Validation avant commit
- 5-10 minutes

### ✅ VALIDATION FINALE (Jour 5)
- Parcours complet
- Tous les rôles (user/admin)
- Documentation des workflows validés

---

## 💡 AVANTAGES DE CETTE APPROCHE

1. **Bugs réels** vs bugs théoriques
2. **Priorisation business** naturelle  
3. **Feedback loop** ultra-court
4. **Tests E2E** basés sur usage réel
5. **Documentation** des parcours validés

---

## 📝 TEMPLATE SESSION DE TEST

```markdown
# SESSION TEST MANUEL - [DATE]

## Environment
- Branch: 
- Heure début:
- Testeur:
- Rôle testé: User / Admin

## Parcours testés
- [ ] Connexion → Dashboard
- [ ] Dashboard → Congés  
- [ ] Congés → Nouveau
- [ ] Planning → Visualisation
- [ ] Admin → Utilisateurs

## Bugs rencontrés
[Utiliser format ci-dessus]

## Notes
[Observations générales]
```

---

## 🎯 DÉCISION

**On commence par ÇA** avant les tests unitaires ?

Avantages :
- Vision claire des priorités
- Fixes qui apportent valeur immédiate
- Base pour tests automatisés pertinents

Action immédiate :
1. `npm run dev`
2. Test manuel 30 min
3. Rapport structuré
4. Fixes prioritaires