#!/usr/bin/env node

/**
 * Script de gestion de l'inventaire des tests E2E
 * Usage: node tests/e2e/scripts/inventory-manager.js [command] [options]
 */

const fs = require('fs');
const path = require('path');

const INVENTORY_PATH = path.join(__dirname, '../test-inventory.json');
const CHANGELOG_PATH = path.join(__dirname, '../test-changelog.md');

class E2EInventoryManager {
    constructor() {
        this.inventory = this.loadInventory();
    }

    loadInventory() {
        try {
            return JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));
        } catch (error) {
            console.error('❌ Erreur lecture inventaire:', error.message);
            process.exit(1);
        }
    }

    saveInventory() {
        try {
            // Mettre à jour metadata
            this.inventory.metadata.lastUpdated = new Date().toISOString().split('T')[0];
            this.recalculateMetrics();

            fs.writeFileSync(INVENTORY_PATH, JSON.stringify(this.inventory, null, 2));
            console.log('✅ Inventaire mis à jour:', INVENTORY_PATH);
        } catch (error) {
            console.error('❌ Erreur sauvegarde inventaire:', error.message);
        }
    }

    recalculateMetrics() {
        let totalRoutes = 0;
        let testedRoutes = 0;
        let criticalRoutes = 0;
        let criticalTested = 0;

        Object.values(this.inventory.workflows).forEach(workflow => {
            Object.values(workflow.routes).forEach(route => {
                totalRoutes++;

                if (route.testStatus === 'TESTED' || route.testStatus === 'TESTING') {
                    testedRoutes++;
                }

                if (route.priority === 'CRITICAL' || workflow.priority === 'CRITICAL') {
                    criticalRoutes++;
                    if (route.testStatus === 'TESTED') {
                        criticalTested++;
                    }
                }
            });
        });

        this.inventory.metadata.totalRoutes = totalRoutes;
        this.inventory.metadata.testedRoutes = testedRoutes;
        this.inventory.metadata.coveragePercentage = Math.round((testedRoutes / totalRoutes) * 100 * 10) / 10;
        this.inventory.metadata.criticalRoutes = criticalRoutes;
        this.inventory.metadata.criticalCoverage = Math.round((criticalTested / criticalRoutes) * 100 * 10) / 10;
    }

    // Commande: status - Afficher le status actuel
    displayStatus() {
        console.log('\n📊 **STATUS TESTS E2E MATHILDANESTH**\n');

        const meta = this.inventory.metadata;
        console.log(`📅 Dernière MAJ: ${meta.lastUpdated}`);
        console.log(`📊 Coverage global: ${meta.coveragePercentage}% (${meta.testedRoutes}/${meta.totalRoutes} routes)`);
        console.log(`🎯 Coverage critique: ${meta.criticalCoverage}% (${meta.criticalRoutes} routes critiques)`);

        // Status par workflow
        console.log('\n🔄 **STATUS PAR WORKFLOW**\n');
        Object.entries(this.inventory.workflows).forEach(([key, workflow]) => {
            const statusEmoji = {
                'NOT_STARTED': '⚪',
                'IN_PROGRESS': '🟡',
                'PARTIAL': '🟠',
                'COMPLETED': '🟢'
            };

            console.log(`${statusEmoji[workflow.status]} ${workflow.name}: ${workflow.coverage || 0}% - ${workflow.status}`);
        });

        // Validation des règles
        console.log('\n⚠️  **VALIDATION RÈGLES**\n');
        const rules = this.inventory.validationRules;

        if (meta.criticalCoverage < rules.minCriticalCoverage) {
            console.log(`🚨 Coverage critique insuffisant: ${meta.criticalCoverage}% < ${rules.minCriticalCoverage}%`);
        }

        if (meta.coveragePercentage < rules.minOverallCoverage) {
            console.log(`⚠️  Coverage global insuffisant: ${meta.coveragePercentage}% < ${rules.minOverallCoverage}%`);
        }
    }

    // Commande: invalidate - Invalider des tests après modification code
    invalidateTests(routes) {
        console.log(`\n❌ **INVALIDATION TESTS POUR ROUTES: ${routes.join(', ')}**\n`);

        let invalidatedCount = 0;

        Object.values(this.inventory.workflows).forEach(workflow => {
            Object.entries(workflow.routes).forEach(([routePath, route]) => {
                if (routes.includes(routePath)) {
                    if (route.testStatus === 'TESTED') {
                        route.testStatus = 'NEEDS_REVALIDATION';
                        route.invalidatedAt = new Date().toISOString();
                        invalidatedCount++;
                        console.log(`❌ ${routePath} - Marqué pour re-validation`);
                    }
                }
            });
        });

        if (invalidatedCount > 0) {
            this.saveInventory();
            console.log(`\n✅ ${invalidatedCount} tests invalidés. Re-validation requise.`);
        } else {
            console.log('\n⚠️  Aucun test trouvé pour les routes spécifiées.');
        }
    }

    // Commande: validate - Marquer des tests comme validés
    validateTests(routes, status = 'TESTED') {
        console.log(`\n✅ **VALIDATION TESTS POUR ROUTES: ${routes.join(', ')}**\n`);

        let validatedCount = 0;

        Object.values(this.inventory.workflows).forEach(workflow => {
            Object.entries(workflow.routes).forEach(([routePath, route]) => {
                if (routes.includes(routePath)) {
                    route.testStatus = status;
                    route.lastTested = new Date().toISOString().split('T')[0];
                    delete route.invalidatedAt;
                    validatedCount++;
                    console.log(`✅ ${routePath} - Marqué comme ${status}`);
                }
            });
        });

        if (validatedCount > 0) {
            this.saveInventory();
            console.log(`\n✅ ${validatedCount} tests validés.`);
        }
    }

    // Commande: add-route - Ajouter une nouvelle route
    addRoute(workflow, routePath, routeData) {
        if (!this.inventory.workflows[workflow]) {
            console.error(`❌ Workflow inexistant: ${workflow}`);
            return;
        }

        this.inventory.workflows[workflow].routes[routePath] = {
            name: routeData.name || routePath,
            method: routeData.method || 'GET',
            testStatus: 'NOT_TESTED',
            priority: routeData.priority || 'MEDIUM',
            ...routeData
        };

        this.saveInventory();
        console.log(`✅ Route ajoutée: ${routePath} dans workflow ${workflow}`);
    }

    // Commande: report - Générer rapport détaillé
    generateReport() {
        console.log('\n📋 **RAPPORT DÉTAILLÉ TESTS E2E**\n');

        Object.entries(this.inventory.workflows).forEach(([workflowKey, workflow]) => {
            console.log(`\n## ${workflow.name} (${workflow.priority})\n`);

            Object.entries(workflow.routes).forEach(([routePath, route]) => {
                const statusEmoji = {
                    'NOT_TESTED': '⚪',
                    'PLANNED': '🔵',
                    'TESTING': '🟡',
                    'TESTED': '🟢',
                    'NEEDS_REVALIDATION': '🔄',
                    'FAILING': '🔴'
                };

                console.log(`${statusEmoji[route.testStatus]} ${routePath} - ${route.name}`);

                if (route.scenarios) {
                    route.scenarios.forEach(scenario => {
                        console.log(`   ${statusEmoji[scenario.status] || '⚪'} ${scenario.name}`);
                    });
                }
            });
        });
    }

    // Commande: needs-attention - Lister ce qui nécessite attention
    needsAttention() {
        console.log('\n🚨 **ÉLÉMENTS NÉCESSITANT ATTENTION**\n');

        let hasIssues = false;

        // Tests en échec
        Object.values(this.inventory.workflows).forEach(workflow => {
            Object.entries(workflow.routes).forEach(([routePath, route]) => {
                if (route.testStatus === 'FAILING' || route.testStatus === 'NEEDS_REVALIDATION') {
                    console.log(`🔴 ${routePath}: ${route.testStatus}`);
                    hasIssues = true;
                }
            });
        });

        // Tests critiques non couverts
        Object.values(this.inventory.workflows).forEach(workflow => {
            if (workflow.priority === 'CRITICAL' && workflow.status === 'NOT_STARTED') {
                console.log(`⚠️  Workflow critique non démarré: ${workflow.name}`);
                hasIssues = true;
            }
        });

        if (!hasIssues) {
            console.log('✅ Aucun problème détecté !');
        }
    }
}

// Interface CLI
function main() {
    const manager = new E2EInventoryManager();
    const command = process.argv[2];
    const args = process.argv.slice(3);

    switch (command) {
        case 'status':
            manager.displayStatus();
            break;

        case 'invalidate':
            const routesToInvalidate = args[0] ? args[0].split(',') : [];
            if (routesToInvalidate.length === 0) {
                console.error('❌ Usage: invalidate "route1,route2"');
                process.exit(1);
            }
            manager.invalidateTests(routesToInvalidate);
            break;

        case 'validate':
            const routesToValidate = args[0] ? args[0].split(',') : [];
            const status = args[1] || 'TESTED';
            if (routesToValidate.length === 0) {
                console.error('❌ Usage: validate "route1,route2" [status]');
                process.exit(1);
            }
            manager.validateTests(routesToValidate, status);
            break;

        case 'report':
            manager.generateReport();
            break;

        case 'needs-attention':
            manager.needsAttention();
            break;

        default:
            console.log(`
📊 **E2E Inventory Manager - Mathildanesth**

Usage: node inventory-manager.js [command] [options]

Commands:
  status              Afficher le status actuel
  invalidate "r1,r2"  Invalider des tests après modification code
  validate "r1,r2"    Marquer des tests comme validés
  report              Générer rapport détaillé
  needs-attention     Lister éléments nécessitant attention

Examples:
  node inventory-manager.js status
  node inventory-manager.js invalidate "/auth/connexion,/conges"
  node inventory-manager.js validate "/auth/connexion" "TESTED"
            `);
    }
}

if (require.main === module) {
    main();
}

module.exports = E2EInventoryManager; 