import { prisma } from '../src/lib/prisma';

const API_BASE_URL = 'http://localhost:3000';

// Helper pour faire des requêtes avec auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Récupérer un token valide depuis la base de données
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN_TOTAL' },
  });

  if (!adminUser) {
    throw new Error('Aucun utilisateur admin trouvé pour les tests');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth-token=test-token-${adminUser.id}`, // Simuler un token
      ...options.headers,
    },
    credentials: 'include',
  });

  return response;
}

async function testTrameAffectationsAPI() {
  console.log('🧪 Test des API TrameModele Affectations\n');

  try {
    // 1. Trouver un TrameModele existant
    console.log("1️⃣ Recherche d'un TrameModele existant...");
    const trameModele = await prisma.trameModele.findFirst({
      include: {
        affectations: {
          include: {
            personnelRequis: true,
            activityType: true,
            operatingRoom: true,
          },
        },
      },
    });

    if (!trameModele) {
      console.error("❌ Aucun TrameModele trouvé. Création d'un modèle de test...");

      // Créer un site de test
      const site =
        (await prisma.site.findFirst()) ||
        (await prisma.site.create({
          data: {
            name: 'Site de Test',
            address: '123 rue Test',
            city: 'TestVille',
            zipCode: '12345',
          },
        }));

      // Créer un TrameModele de test
      const newTrame = await prisma.trameModele.create({
        data: {
          name: 'Test TrameModele API',
          description: 'Modèle créé pour tester les API',
          siteId: site.id,
          typeRecurrence: 'WEEKLY',
          isActive: true,
          joursActifs: [1, 2, 3, 4, 5], // Lundi à Vendredi
        },
      });

      console.log('✅ TrameModele de test créé:', newTrame.name);
      return;
    }

    console.log(`✅ TrameModele trouvé: ${trameModele.name} (ID: ${trameModele.id})`);
    console.log(`   Nombre d'affectations existantes: ${trameModele.affectations.length}\n`);

    // 2. Test GET - Récupérer toutes les affectations
    console.log('2️⃣ Test GET /api/trame-modeles/[id]/affectations');
    const getResponse = await fetchWithAuth(`/api/trame-modeles/${trameModele.id}/affectations`);

    if (getResponse.ok) {
      const affectations = await getResponse.json();
      console.log(`✅ GET réussi - ${affectations.length} affectations récupérées`);

      if (affectations.length > 0) {
        console.log("   Exemple d'affectation:");
        const first = affectations[0];
        console.log(`   - Jour: ${first.jourSemaine}`);
        console.log(`   - Période: ${first.periode}`);
        console.log(`   - Type semaine: ${first.typeSemaine}`);
        console.log(`   - Activité: ${first.activityType?.name || 'N/A'}`);
      }
    } else {
      console.error(`❌ GET échoué: ${getResponse.status} ${getResponse.statusText}`);
      const error = await getResponse.text();
      console.error('   Erreur:', error);
    }

    // 3. Test POST - Créer une nouvelle affectation
    console.log('\n3️⃣ Test POST /api/trame-modeles/[id]/affectations');

    // Trouver un type d'activité
    const activityType =
      (await prisma.activityType.findFirst()) ||
      (await prisma.activityType.create({
        data: {
          name: 'Anesthésie Test',
          description: "Type d'activité pour les tests",
          color: '#3B82F6',
        },
      }));

    // Trouver une salle d'opération
    const operatingRoom = await prisma.operatingRoom.findFirst();

    const newAffectationData = {
      activityTypeId: activityType.id,
      jourSemaine: 1, // Lundi
      periode: 'MORNING',
      typeSemaine: 'ALL',
      operatingRoomId: operatingRoom?.id,
      priorite: 5,
      isActive: true,
      personnelRequis: [
        {
          roleGenerique: 'IADE',
          nombreRequis: 2,
          notes: 'Test personnel IADE',
        },
        {
          roleGenerique: 'MAR',
          nombreRequis: 1,
          notes: 'Test personnel MAR',
        },
      ],
    };

    console.log('   Données à envoyer:', JSON.stringify(newAffectationData, null, 2));

    const postResponse = await fetchWithAuth(`/api/trame-modeles/${trameModele.id}/affectations`, {
      method: 'POST',
      body: JSON.stringify(newAffectationData),
    });

    let createdAffectationId: number | null = null;

    if (postResponse.ok) {
      const created = await postResponse.json();
      createdAffectationId = created.id;
      console.log(`✅ POST réussi - Affectation créée avec ID: ${created.id}`);
      console.log(`   Personnel requis créé: ${created.personnelRequis?.length || 0} postes`);
    } else {
      console.error(`❌ POST échoué: ${postResponse.status} ${postResponse.statusText}`);
      const error = await postResponse.text();
      console.error('   Erreur:', error);
    }

    // 4. Test PUT - Mettre à jour l'affectation
    if (createdAffectationId) {
      console.log('\n4️⃣ Test PUT /api/trame-modeles/[id]/affectations/[affectationId]');

      const updateData = {
        isActive: false,
        notes: 'Affectation désactivée pour test',
        priorite: 10,
      };

      const putResponse = await fetchWithAuth(
        `/api/trame-modeles/${trameModele.id}/affectations/${createdAffectationId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      if (putResponse.ok) {
        const updated = await putResponse.json();
        console.log(`✅ PUT réussi - Affectation mise à jour`);
        console.log(`   Active: ${updated.affectation?.isActive}`);
        console.log(`   Priorité: ${updated.affectation?.priorite}`);
      } else {
        console.error(`❌ PUT échoué: ${putResponse.status} ${putResponse.statusText}`);
        const error = await putResponse.text();
        console.error('   Erreur:', error);
      }

      // 5. Test DELETE - Supprimer l'affectation
      console.log('\n5️⃣ Test DELETE /api/trame-modeles/[id]/affectations/[affectationId]');

      const deleteResponse = await fetchWithAuth(
        `/api/trame-modeles/${trameModele.id}/affectations/${createdAffectationId}`,
        {
          method: 'DELETE',
        }
      );

      if (deleteResponse.ok) {
        console.log(`✅ DELETE réussi - Affectation supprimée`);
      } else {
        console.error(`❌ DELETE échoué: ${deleteResponse.status} ${deleteResponse.statusText}`);
        const error = await deleteResponse.text();
        console.error('   Erreur:', error);
      }
    }

    // 6. Test Batch - Opérations en lot
    console.log('\n6️⃣ Test POST /api/trame-modeles/[id]/affectations/batch');

    const batchData = {
      create: [
        {
          userId: '1', // À adapter selon vos utilisateurs
          operatingRoomId: operatingRoom?.id?.toString() || '1',
          dayOfWeek: 1, // Lundi
          shiftType: 'MORNING',
          weekType: 'EVEN',
        },
        {
          userId: '1',
          operatingRoomId: operatingRoom?.id?.toString() || '1',
          dayOfWeek: 3, // Mercredi
          shiftType: 'AFTERNOON',
          weekType: 'ODD',
        },
      ],
    };

    const batchResponse = await fetchWithAuth(
      `/api/trame-modeles/${trameModele.id}/affectations/batch`,
      {
        method: 'POST',
        body: JSON.stringify(batchData),
      }
    );

    if (batchResponse.ok) {
      const batchResult = await batchResponse.json();
      console.log(`✅ BATCH réussi - ${batchResult.length} affectations après opération`);
    } else {
      console.error(`❌ BATCH échoué: ${batchResponse.status} ${batchResponse.statusText}`);
      const error = await batchResponse.text();
      console.error('   Erreur:', error);
    }

    // Résumé final
    console.log('\n📊 Résumé des tests:');
    const finalGetResponse = await fetchWithAuth(
      `/api/trame-modeles/${trameModele.id}/affectations`
    );
    if (finalGetResponse.ok) {
      const finalAffectations = await finalGetResponse.json();
      console.log(`   Total des affectations: ${finalAffectations.length}`);

      // Analyser les semaines paires/impaires
      const evenWeeks = finalAffectations.filter((a: any) => a.typeSemaine === 'EVEN').length;
      const oddWeeks = finalAffectations.filter((a: any) => a.typeSemaine === 'ODD').length;
      const allWeeks = finalAffectations.filter((a: any) => a.typeSemaine === 'ALL').length;

      console.log(`   - Toutes les semaines: ${allWeeks}`);
      console.log(`   - Semaines paires: ${evenWeeks}`);
      console.log(`   - Semaines impaires: ${oddWeeks}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testTrameAffectationsAPI()
  .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
