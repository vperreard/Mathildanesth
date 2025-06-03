import { TrameAffectationService } from '@/services/trameAffectationService';
import TrameAffectation, { TrameAffectationAttributes } from '@/models/TrameAffectation';
import {
  createTrameAffectationAttributes,
  createTrameAffectationData,
} from '../../factories/trameAffectationFactory'; // Import de la factory

// Mocker le modèle Sequelize TrameAffectation
jest.mock('@/models/TrameAffectation', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

// Type pour le mock du modèle pour une utilisation plus facile dans les tests
const MockedTrameAffectation = TrameAffectation as jest.Mocked<typeof TrameAffectation>;

describe('TrameAffectationService', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Tests pour la méthode create ---
  describe('create', () => {
    it('should create a new trame and return its attributes', async () => {
      // Utiliser la factory pour générer les données d'entrée
      const newTrameData = createTrameAffectationData({ userId: 1, motif: 'Test Create' });
      // Utiliser la factory pour générer les données de sortie attendues (avec id/timestamps)
      const createdTrameAttributes = createTrameAffectationAttributes({ ...newTrameData });

      // Configurer le mock pour retourner les attributs créés
      // Sequelize create retourne une instance, mais le service ne semble utiliser que les attributs.
      // Si le service a besoin de l'instance complète, il faudra ajuster ici.
      MockedTrameAffectation.create.mockResolvedValue(createdTrameAttributes as any); // Cast car le mock s'attend à une instance

      const result = await TrameAffectationService.create(newTrameData);

      expect(MockedTrameAffectation.create).toHaveBeenCalledWith(newTrameData);
      // Comparer les attributs retournés
      expect(result).toEqual(createdTrameAttributes);
    });

    it('should throw an error if creation fails', async () => {
      const newTrameData = createTrameAffectationData();
      const errorMessage = 'Database error';
      MockedTrameAffectation.create.mockRejectedValue(new Error(errorMessage));

      await expect(TrameAffectationService.create(newTrameData)).rejects.toThrow(
        "Impossible de créer la trameModele d'garde/vacation"
      );
      expect(MockedTrameAffectation.create).toHaveBeenCalledWith(newTrameData);
    });
  });

  // --- Tests pour la méthode findAll ---
  describe('findAll', () => {
    it('should return all trames attributes ordered by createdAt DESC', async () => {
      // Utiliser la factory pour générer les données mockées
      const mockTrameAttrs1 = createTrameAffectationAttributes({
        createdAt: new Date('2024-01-10'),
      });
      const mockTrameAttrs2 = createTrameAffectationAttributes({
        createdAt: new Date('2024-01-15'),
      });
      const mockTramesAttributes = [mockTrameAttrs2, mockTrameAttrs1]; // Ordre attendu

      MockedTrameAffectation.findAll.mockResolvedValue(mockTramesAttributes as any); // Cast car le mock s'attend à des instances

      const result = await TrameAffectationService.findAll();

      expect(MockedTrameAffectation.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual(mockTramesAttributes);
    });

    it('should throw an error if findAll fails', async () => {
      const errorMessage = 'Database error';
      MockedTrameAffectation.findAll.mockRejectedValue(new Error(errorMessage));

      await expect(TrameAffectationService.findAll()).rejects.toThrow(
        "Impossible de récupérer les trameModeles d'garde/vacation"
      );
      expect(MockedTrameAffectation.findAll).toHaveBeenCalled();
    });
  });

  // --- Tests pour la méthode findById ---
  describe('findById', () => {
    it('should return trame attributes if found', async () => {
      const trameId = 'uuid-found';
      const mockTrameAttributes = createTrameAffectationAttributes({
        id: trameId,
        motif: 'Found Trame',
      });
      MockedTrameAffectation.findByPk.mockResolvedValue(mockTrameAttributes as any);

      const result = await TrameAffectationService.findById(trameId);

      expect(MockedTrameAffectation.findByPk).toHaveBeenCalledWith(trameId);
      expect(result).toEqual(mockTrameAttributes);
    });

    it('should throw an error if trame is not found', async () => {
      const trameId = 'uuid-not-found';
      MockedTrameAffectation.findByPk.mockResolvedValue(null);

      await expect(TrameAffectationService.findById(trameId)).rejects.toThrow(
        "TrameModele d'garde/vacation non trouvée"
      );
      expect(MockedTrameAffectation.findByPk).toHaveBeenCalledWith(trameId);
    });

    it('should throw an error if findByPk fails', async () => {
      const trameId = 'uuid-error';
      const errorMessage = 'Database error';
      MockedTrameAffectation.findByPk.mockRejectedValue(new Error(errorMessage));

      await expect(TrameAffectationService.findById(trameId)).rejects.toThrow(
        "Impossible de récupérer la trameModele d'garde/vacation"
      );
      expect(MockedTrameAffectation.findByPk).toHaveBeenCalledWith(trameId);
    });
  });

  // --- Tests pour la méthode update ---
  describe('update', () => {
    const trameId = 'uuid-to-update';
    const updateData: Partial<TrameAffectationAttributes> = { motif: 'Updated Motif' };
    // Utiliser la factory pour les données après mise à jour
    const updatedTrameAttributes = createTrameAffectationAttributes({
      id: trameId,
      motif: 'Updated Motif',
    });

    it('should update the trame and return the updated attributes', async () => {
      MockedTrameAffectation.update.mockResolvedValue([1]);
      // Le service appelle findById après update, qui appelle findByPk
      MockedTrameAffectation.findByPk.mockResolvedValue(updatedTrameAttributes as any);

      const result = await TrameAffectationService.update(trameId, updateData);

      expect(MockedTrameAffectation.update).toHaveBeenCalledWith(updateData, {
        where: { id: trameId },
      });
      expect(MockedTrameAffectation.findByPk).toHaveBeenCalledWith(trameId);
      expect(result).toEqual(updatedTrameAttributes);
    });

    it('should throw an error if the trame to update is not found', async () => {
      MockedTrameAffectation.update.mockResolvedValue([0]);

      await expect(TrameAffectationService.update(trameId, updateData)).rejects.toThrow(
        "TrameModele d'garde/vacation non trouvée"
      );
      expect(MockedTrameAffectation.update).toHaveBeenCalledWith(updateData, {
        where: { id: trameId },
      });
      expect(MockedTrameAffectation.findByPk).not.toHaveBeenCalled();
    });

    it('should throw an error if update fails', async () => {
      const errorMessage = 'Database error';
      MockedTrameAffectation.update.mockRejectedValue(new Error(errorMessage));

      await expect(TrameAffectationService.update(trameId, updateData)).rejects.toThrow(
        "Impossible de mettre à jour la trameModele d'garde/vacation"
      );
      expect(MockedTrameAffectation.update).toHaveBeenCalledWith(updateData, {
        where: { id: trameId },
      });
      expect(MockedTrameAffectation.findByPk).not.toHaveBeenCalled();
    });
  });

  // --- Tests pour la méthode delete ---
  describe('delete', () => {
    it('should return true if deletion is successful', async () => {
      const trameId = 'uuid-to-delete';
      MockedTrameAffectation.destroy.mockResolvedValue(1);

      const result = await TrameAffectationService.delete(trameId);

      expect(MockedTrameAffectation.destroy).toHaveBeenCalledWith({ where: { id: trameId } });
      expect(result).toBe(true);
    });

    it('should throw an error if the trame to delete is not found', async () => {
      const trameId = 'uuid-not-found';
      MockedTrameAffectation.destroy.mockResolvedValue(0);

      await expect(TrameAffectationService.delete(trameId)).rejects.toThrow(
        "TrameModele d'garde/vacation non trouvée"
      );
      expect(MockedTrameAffectation.destroy).toHaveBeenCalledWith({ where: { id: trameId } });
    });

    it('should throw an error if deletion fails', async () => {
      const trameId = 'uuid-error';
      const errorMessage = 'Database error';
      MockedTrameAffectation.destroy.mockRejectedValue(new Error(errorMessage));

      await expect(TrameAffectationService.delete(trameId)).rejects.toThrow(
        "Impossible de supprimer la trameModele d'garde/vacation"
      );
      expect(MockedTrameAffectation.destroy).toHaveBeenCalledWith({ where: { id: trameId } });
    });
  });

  // --- Tests pour la méthode findByUserId ---
  describe('findByUserId', () => {
    const userId = 123;
    it('should return trames attributes for a specific user ordered by createdAt DESC', async () => {
      const mockTrameAttrs1 = createTrameAffectationAttributes({
        userId: userId,
        createdAt: new Date('2024-02-10'),
      });
      const mockTrameAttrs2 = createTrameAffectationAttributes({
        userId: userId,
        createdAt: new Date('2024-02-15'),
      });
      const mockTramesAttributes = [mockTrameAttrs2, mockTrameAttrs1]; // Ordre attendu

      MockedTrameAffectation.findAll.mockResolvedValue(mockTramesAttributes as any);

      const result = await TrameAffectationService.findByUserId(userId);

      expect(MockedTrameAffectation.findAll).toHaveBeenCalledWith({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual(mockTramesAttributes);
    });

    it('should return an empty array if no trames found for the user', async () => {
      MockedTrameAffectation.findAll.mockResolvedValue([]);

      const result = await TrameAffectationService.findByUserId(userId);

      expect(MockedTrameAffectation.findAll).toHaveBeenCalledWith({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual([]);
    });

    it('should throw an error if findAll fails for user', async () => {
      const errorMessage = 'Database error';
      MockedTrameAffectation.findAll.mockRejectedValue(new Error(errorMessage));

      await expect(TrameAffectationService.findByUserId(userId)).rejects.toThrow(
        "Impossible de récupérer les trameModeles d'garde/vacation de l'utilisateur"
      );
      expect(MockedTrameAffectation.findAll).toHaveBeenCalledWith({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
    });
  });
});
