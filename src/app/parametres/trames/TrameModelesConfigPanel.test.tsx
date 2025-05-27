import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import TrameModelesConfigPanel from './TrameModelesConfigPanel';
import { useAuth } from '@/hooks/useAuth'; // Assurez-vous que le chemin est correct
import { fireEvent } from '@testing-library/react';

// Mocker axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mocker le hook useAuth
jest.mock('@/hooks/useAuth');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mocker les icônes lucide-react pour éviter les erreurs de rendu SVG dans les tests
jest.mock('lucide-react', () => {
  const originalModule = jest.requireActual('lucide-react');
  return {
    ...originalModule,
    // Mocker chaque icône utilisée par le composant
    Plus: () => <svg data-testid="icon-plus" />,
    Edit: () => <svg data-testid="icon-edit" />,
    Trash2: () => <svg data-testid="icon-trash2" />,
    Eye: () => <svg data-testid="icon-eye" />,
    AlertTriangle: () => <svg data-testid="icon-alert-triangle" />,
    Loader2: () => <svg data-testid="icon-loader2" />,
    CheckCircle2: () => <svg data-testid="icon-check-circle2" />,
    XCircle: () => <svg data-testid="icon-x-circle" />,
    Save: () => <svg data-testid="icon-save" />,
    ListPlus: () => <svg data-testid="icon-list-plus" />,
    Edit3: () => <svg data-testid="icon-edit3" />,
    Trash: () => <svg data-testid="icon-trash" />,
    Copy: () => <svg data-testid="icon-copy" />,
  };
});

describe('TrameModelesConfigPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser les mocks avant chaque test
    mockedAxios.get.mockReset();
    mockedUseAuth.mockReset();

    // Mock par défaut pour useAuth (authentifié)
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'ADMIN_TOTAL',
        prenom: 'Test',
        nom: 'User',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refetchUser: jest.fn(),
    });

    // Mock par défaut pour les appels API (listes vides au départ)
    mockedAxios.get.mockImplementation(url => {
      if (url === '/api/trameModele-modeles?includeAffectations=true') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/sites') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/activity-types') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/operating-rooms') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/admin/professional-role-configs') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/specialties') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unhandled GET request: ${url}`));
    });
  });

  test('devrait afficher le titre principal et le bouton "Ajouter un template" lorsque authentifié', async () => {
    render(<TrameModelesConfigPanel />);

    // Vérifier le titre
    expect(screen.getByText('Gestion des Modèles de TrameModele')).toBeInTheDocument();

    // Attendre que l'état de chargement initial soit résolu
    // Le bouton "Ajouter un template" ne s'affiche que si !isLoading et isAuthenticated
    await waitFor(() => {
      expect(screen.queryByText('Chargement des templates de trameModele...')).not.toBeInTheDocument();
    });

    // Vérifier la présence du bouton "Ajouter un template"
    expect(screen.getByRole('button', { name: /Ajouter un template/i })).toBeInTheDocument();
  });

  test("devrait afficher un message de non authentifié si l'utilisateur n'est pas connecté", async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refetchUser: jest.fn(),
    });

    render(<TrameModelesConfigPanel />);

    await waitFor(() => {
      expect(
        screen.getByText('Vous devez être connecté pour gérer les templates de trameModele.')
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /Ajouter un template/i })).not.toBeInTheDocument();
  });

  test('devrait afficher "Aucun template de trameModele" si la liste est vide après chargement', async () => {
    // Les mocks par défaut retournent déjà des listes vides
    render(<TrameModelesConfigPanel />);

    await waitFor(() => {
      expect(screen.getByText('Aucun template de trameModele')).toBeInTheDocument();
    });
    expect(screen.getByText('Commencez par créer un nouveau template de trameModele.')).toBeInTheDocument();
  });

  // D'autres tests suivront :
  // - Affichage des templates de trameModele dans le tableau
  // - Ouverture de la modale de création/édition
  // - Soumission du formulaire de TrameModele (création et édition)
  // - Suppression d'un TrameModele
  // - Affichage des AffectationModele dans la modale
  // - Ouverture de la modale d'AffectationModele
  // - Soumission du formulaire d'AffectationModele (avec PersonnelRequisModele)
  // - Validation Zod des formulaires
  // - Suppression d'une AffectationModele
  // - Duplication d'un PersonnelRequisModele
});

// Helper pour générer des données de TrameModele pour les tests
const mockTrameModele = (id: number, name: string, siteName?: string): any => ({
  id,
  name,
  description: `Description de ${name}`,
  siteId: siteName ? `site-${id}` : null,
  site: siteName ? { id: `site-${id}`, name: siteName, description: '' } : null,
  isActive: true,
  dateDebutEffet: new Date().toISOString(),
  dateFinEffet: null,
  recurrenceType: 'HEBDOMADAIRE', // Assurez-vous que cela correspond à RecurrenceTypeTrame
  joursSemaineActifs: [1, 2, 3, 4, 5],
  typeSemaine: 'TOUTES', // Assurez-vous que cela correspond à TypeSemaineTrame
  affectations: [],
  // Ajoutez d'autres champs de TrameModele si nécessaire pour les tests
});

describe('TrameModelesConfigPanel - Affichage des données', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockReset();
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'ADMIN_TOTAL',
        prenom: 'Test',
        nom: 'User',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refetchUser: jest.fn(),
    });
    // Configuration par défaut des mocks axios pour ce describe block si différent
  });

  test('devrait afficher les templates de trameModele dans le tableau', async () => {
    const tramesMock = [
      mockTrameModele(1, 'TrameModele Alpha', 'Site A'),
      mockTrameModele(2, 'TrameModele Beta', 'Site B'),
    ];
    mockedAxios.get.mockImplementation(url => {
      if (url === '/api/trameModele-modeles?includeAffectations=true') {
        return Promise.resolve({ data: tramesMock });
      }
      if (url === '/api/sites')
        return Promise.resolve({
          data: [
            { id: 'site-1', name: 'Site A' },
            { id: 'site-2', name: 'Site B' },
          ],
        });
      if (url === '/api/activity-types') return Promise.resolve({ data: [] });
      if (url === '/api/operating-rooms') return Promise.resolve({ data: [] });
      if (url === '/api/admin/professional-role-configs') return Promise.resolve({ data: [] });
      if (url === '/api/specialties') return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unhandled GET request: ${url}`));
    });

    render(<TrameModelesConfigPanel />);

    // Attendre que les données soient chargées et affichées
    await waitFor(() => {
      expect(screen.getByText('TrameModele Alpha')).toBeInTheDocument();
      expect(screen.getByText('Site A')).toBeInTheDocument();
      expect(screen.getByText('TrameModele Beta')).toBeInTheDocument();
      expect(screen.getByText('Site B')).toBeInTheDocument();
    });

    // Vérifier la présence des boutons Modifier et Supprimer pour chaque ligne (exemple pour la première)
    // Note : les sélecteurs devront être plus spécifiques si plusieurs boutons "Modifier" existent
    const rows = screen.getAllByRole('row');
    // La première ligne est l'entête, donc on commence à l'index 1
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByRole('button', { name: /Modifier/i })).toBeInTheDocument();
    expect(within(firstDataRow).getByRole('button', { name: /Supprimer/i })).toBeInTheDocument();
  });
});

describe('TrameModelesConfigPanel - Modale TrameModele', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialisation et configuration des mocks comme dans les describe précédents
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset(); // Aussi pour les créations
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'ADMIN_TOTAL',
        prenom: 'Test',
        nom: 'User',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refetchUser: jest.fn(),
    });

    // Mocks API par défaut pour ce bloc de tests
    mockedAxios.get.mockImplementation(url => {
      if (url === '/api/trameModele-modeles?includeAffectations=true')
        return Promise.resolve({ data: [] });
      if (url === '/api/sites')
        return Promise.resolve({ data: [{ id: 'site-1', name: 'Site Test' }] }); // Fournir un site pour le select
      if (url === '/api/activity-types') return Promise.resolve({ data: [] });
      if (url === '/api/operating-rooms') return Promise.resolve({ data: [] });
      if (url === '/api/admin/professional-role-configs') return Promise.resolve({ data: [] });
      if (url === '/api/specialties') return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unhandled GET request: ${url}`));
    });
  });

  test('devrait ouvrir la modale d\'ajout de TrameModele avec les champs vides lorsque le bouton "Ajouter un template" est cliqué', async () => {
    render(<TrameModelesConfigPanel />);

    // Attendre que le bouton soit disponible après le chargement initial
    const addButton = await screen.findByRole('button', { name: /Ajouter un template/i });
    fireEvent.click(addButton);

    // Vérifier que la modale est ouverte (par son titre)
    expect(await screen.findByText('Ajouter un Modèle de TrameModele')).toBeInTheDocument();

    // Vérifier que les champs principaux sont présents et vides ou avec valeur par défaut
    const nameInput = screen.getByLabelText(/Nom du template/i) as HTMLInputElement;
    expect(nameInput.value).toBe('');

    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe('');

    // Vérifier la date de début (doit avoir une valeur par défaut, la date du jour)
    const dateDebutInput = screen.getByLabelText(/Date de début d\'effet/i) as HTMLInputElement;
    expect(dateDebutInput.value).toBe(new Date().toISOString().split('T')[0]);

    // Vérifier que le select du site est présent
    expect(screen.getByText('Sélectionner un site (optionnel)')).toBeInTheDocument();
    // (Le placeholder peut changer si des sites sont chargés, on vérifie juste la présence du contrôle)

    // Vérifier que la checkbox "Actif" est cochée par défaut
    const isActiveCheckbox = screen.getByLabelText(/Actif/i) as HTMLInputElement;
    expect(isActiveCheckbox.checked).toBe(true);
  });

  // Test pour la soumission du formulaire de création (à ajouter)
  // test('devrait créer un nouveau TrameModele lors de la soumission du formulaire d\'ajout', async () => { ... });
});
