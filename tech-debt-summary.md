# Tech Debt Audit Report

Generated: 2025-06-04T20:22:58.434Z

## Summary

- Total TODOs/FIXMEs: 113
- CRITICAL: 12
- HIGH: 0
- MEDIUM: 90
- LOW: 11

## By Type

- TODO: 107
- FIXME: 2
- HACK: 1
- @todo: 1
- @fixme: 1
- @hack: 1

## Critical Items (12)

### scripts/autonomous-bug-fixer.js:402

Category: CRITICAL
Type: TODO
Content: // TODO: Implement actual authentication logic
Context:
400: try {
401: const body = await request.json();
402: >>> // TODO: Implement actual authentication logic
403: return NextResponse.json({ success: true, message: 'Login endpoint placeholder' });
404: } catch (error) {

### src/app/api/contextual-messages/route.ts:35

Category: CRITICAL
Type: TODO
Content: // 🔐 CORRECTION DES TODO CRITIQUES : Vérifications de permissions fines
Context:
33: ): Promise<boolean> {
34: try {
35: >>> // 🔐 CORRECTION DES TODO CRITIQUES : Vérifications de permissions fines
36:  
37: if (assignmentId) {

### src/app/api/contextual-messages/route.ts:109

Category: CRITICAL
Type: TODO
Content: // 🔐 CORRECTION DU TODO CRITIQUE : Vérifications de permissions fines
Context:
107: }
108:  
109: >>> // 🔐 CORRECTION DU TODO CRITIQUE : Vérifications de permissions fines
110: const hasPermission = await verifyContextPermissions(
111: userId,

### src/app/api/contextual-messages/route.ts:294

Category: CRITICAL
Type: TODO
Content: // 🔐 CORRECTION DU TODO CRITIQUE : Vérifications de permissions de lecture
Context:
292: }
293:  
294: >>> // 🔐 CORRECTION DU TODO CRITIQUE : Vérifications de permissions de lecture
295: const hasPermission = await verifyContextPermissions(
296: userId,

### src/app/api/leaves/route.ts:66

Category: CRITICAL
Type: TODO
Content: // 🔐 CORRECTION DU TODO CRITIQUE : Vérifier les permissions de l'utilisateur
Context:
64: }
65:  
66: >>> // 🔐 CORRECTION DU TODO CRITIQUE : Vérifier les permissions de l'utilisateur
67: const authHeader = request.headers.get('authorization');
68: const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

### src/app/api/simulations/[scenarioId]/route.ts:120

Category: CRITICAL
Type: TODO
Content: // 🔐 CORRECTION DU TODO CRITIQUE : Vérifier les permissions de l'utilisateur
Context:
118: }
119:  
120: >>> // 🔐 CORRECTION DU TODO CRITIQUE : Vérifier les permissions de l'utilisateur
121: if (!existingScenario.createdBy) {
122: return NextResponse.json({ error: 'Scénario invalide.' }, { status: 400 });

### src/app/api/simulations/[scenarioId]/route.ts:182

Category: CRITICAL
Type: TODO
Content: // 🔐 CORRECTION DU TODO CRITIQUE : Vérifier les permissions de l'utilisateur
Context:
180: }
181:  
182: >>> // 🔐 CORRECTION DU TODO CRITIQUE : Vérifier les permissions de l'utilisateur
183: if (!existingScenario.createdBy) {
184: return NextResponse.json({ error: 'Scénario invalide.' }, { status: 400 });

### src/app/api/trame-modeles/[trameModeleId]/affectations/route.ts:24

Category: CRITICAL
Type: TODO
Content: // 🔐 CORRECTION DU TODO CRITIQUE : Vérification de rôle admin pour modifications de trameModeles (déjà fait via withAuth)
Context:
22: console.log('\n--- POST /api/trameModele-modeles/[trameModeleId]/affectations START ---');
23:  
24: >>> // 🔐 CORRECTION DU TODO CRITIQUE : Vérification de rôle admin pour modifications de trameModeles (déjà fait via withAuth)
25: // Logger l'action de création
26: const auditService = new AuditService();

### src/app/bloc-operatoire/\_components/PermissionGuard.tsx:94

Category: CRITICAL
Type: TODO
Content: // TODO: Implémenter la logique de permissions granulaires
Context:
92: // Vérifier une permission spécifique (extensible pour le futur)
93: if (requiredPermission) {
94: >>> // TODO: Implémenter la logique de permissions granulaires
95: // Pour l'instant, on considère que les ADMIN ont toutes les permissions
96: const isAdmin = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(user.role);

### src/hooks/useAppearance.ts:89

Category: CRITICAL
Type: TODO
Content: // TODO: Réactiver une fois l'authentification stabilisée
Context:
87: setLoading(false);
88:  
89: >>> // TODO: Réactiver une fois l'authentification stabilisée
90: /\*
91: async function loadPreferences() {

... and 2 more critical items

## Next Steps

1. Review all CRITICAL items in tech-debt-report.json
2. Create tickets for each critical item
3. Start resolving from most critical to least
