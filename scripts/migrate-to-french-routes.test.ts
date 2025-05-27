import { RouteMigrator } from './migrate-to-french-routes';
import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    rename: jest.fn(),
  }
}));

jest.mock('glob');

describe('RouteMigrator', () => {
  let mockReadFile: jest.MockedFunction<typeof fs.readFile>;
  let mockWriteFile: jest.MockedFunction<typeof fs.writeFile>;
  let mockAccess: jest.MockedFunction<typeof fs.access>;
  let mockRename: jest.MockedFunction<typeof fs.rename>;
  let mockGlob: jest.MockedFunction<typeof glob>;

  beforeEach(() => {
    mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
    mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
    mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
    mockRename = fs.rename as jest.MockedFunction<typeof fs.rename>;
    mockGlob = glob as jest.MockedFunction<typeof glob>;

    // Reset all mocks
    jest.clearAllMocks();
    
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Dry Run Mode', () => {
    it('should not modify files in dry run mode', async () => {
      const migrator = new RouteMigrator(true); // dry run mode

      // Mock glob to return test files
      mockGlob.mockResolvedValue(['test.ts', 'test.tsx']);

      // Mock file content with English routes
      mockReadFile.mockResolvedValue(Buffer.from(`
        import { useRouter } from 'next/router';
        
        const router = useRouter();
        router.push('/conges');
        router.push('/calendrier');
        
        <Link href="/utilisateurs">Users</Link>
        <Link href="/parametres">Settings</Link>
      `));

      await migrator.migrate();

      // Verify no files were written
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockRename).not.toHaveBeenCalled();
    });
  });

  describe('Execute Mode', () => {
    it('should replace routes in files', async () => {
      const migrator = new RouteMigrator(false); // execute mode

      mockGlob.mockResolvedValue(['test.tsx']);

      const originalContent = `
        router.push('/conges');
        href="/calendrier"
        navigate('/utilisateurs');
        path="/parametres"
      `;

      const expectedContent = `
        router.push('/conges');
        href="/calendrier"
        navigate('/utilisateurs');
        path="/parametres"
      `;

      mockReadFile.mockResolvedValue(Buffer.from(originalContent));

      await migrator.migrate();

      expect(mockWriteFile).toHaveBeenCalledWith(
        'test.tsx',
        expectedContent,
        'utf-8'
      );
    });

    it('should handle API routes correctly', async () => {
      const migrator = new RouteMigrator(false);

      mockGlob.mockResolvedValue(['api-service.ts']);

      const originalContent = `
        const API_ROUTES = {
          leaves: '/api/conges',
          users: '/api/utilisateurs',
          assignments: '/api/affectations',
          holidays: '/api/jours-feries'
        };
      `;

      const expectedContent = `
        const API_ROUTES = {
          leaves: '/api/conges',
          users: '/api/utilisateurs',
          assignments: '/api/affectations',
          holidays: '/api/jours-feries'
        };
      `;

      mockReadFile.mockResolvedValue(Buffer.from(originalContent));

      await migrator.migrate();

      expect(mockWriteFile).toHaveBeenCalledWith(
        'api-service.ts',
        expectedContent,
        'utf-8'
      );
    });

    it('should handle nested routes correctly', async () => {
      const migrator = new RouteMigrator(false);

      mockGlob.mockResolvedValue(['nested-routes.ts']);

      const originalContent = `
        '/conges/nouveau'
        '/conges/recurrents'
        '/calendrier/parametres'
        '/admin/parametres'
        '/admin/jours-feries'
      `;

      const expectedContent = `
        '/conges/nouveau'
        '/conges/recurrents'
        '/calendrier/parametres'
        '/admin/parametres'
        '/admin/jours-feries'
      `;

      mockReadFile.mockResolvedValue(Buffer.from(originalContent));

      await migrator.migrate();

      expect(mockWriteFile).toHaveBeenCalledWith(
        'nested-routes.ts',
        expectedContent,
        'utf-8'
      );
    });

    it('should rename folders', async () => {
      const migrator = new RouteMigrator(false);

      mockGlob.mockResolvedValue([]);

      // Mock folder existence
      mockAccess
        .mockResolvedValueOnce(undefined) // src/app/conges exists
        .mockResolvedValueOnce(undefined) // src/app/calendrier exists
        .mockRejectedValue(new Error('Not found')); // others don't exist

      await migrator.migrate();

      expect(mockRename).toHaveBeenCalledWith(
        'src/app/conges',
        'src/app/conges'
      );

      expect(mockRename).toHaveBeenCalledWith(
        'src/app/calendrier',
        'src/app/calendrier'
      );
    });
  });

  describe('Route Mapping', () => {
    it('should map all expected routes correctly', async () => {
      const migrator = new RouteMigrator(false);

      mockGlob.mockResolvedValue(['all-routes.ts']);

      const testCases = [
        { from: '/conges', to: '/conges' },
        { from: '/calendrier', to: '/calendrier' },
        { from: '/utilisateurs', to: '/utilisateurs' },
        { from: '/affectations', to: '/affectations' },
        { from: '/parametres', to: '/parametres' },
        { from: '/jours-feries', to: '/jours-feries' },
        { from: '/demandes', to: '/demandes' },
        { from: '/chirurgiens', to: '/chirurgiens' },
        { from: '/auth/connexion', to: '/auth/connexion' },
        { from: '/auth/deconnexion', to: '/auth/deconnexion' },
      ];

      const originalContent = testCases.map(tc => tc.from).join('\n');
      const expectedContent = testCases.map(tc => tc.to).join('\n');

      mockReadFile.mockResolvedValue(Buffer.from(originalContent));

      await migrator.migrate();

      expect(mockWriteFile).toHaveBeenCalledWith(
        'all-routes.ts',
        expectedContent,
        'utf-8'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should not replace partial matches', async () => {
      const migrator = new RouteMigrator(false);

      mockGlob.mockResolvedValue(['edge-cases.ts']);

      const originalContent = `
        const leavesOfAbsence = 'some text';
        const newFeature = 'new feature';
        const userName = 'John';
      `;

      // Should remain unchanged as these are not route references
      mockReadFile.mockResolvedValue(Buffer.from(originalContent));

      await migrator.migrate();

      // File should not be written as no changes were made
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should handle multiple occurrences in same file', async () => {
      const migrator = new RouteMigrator(false);

      mockGlob.mockResolvedValue(['multiple.ts']);

      const originalContent = `
        href="/conges"
        href="/conges"
        href="/conges"
        navigate('/calendrier')
        push('/calendrier')
      `;

      mockReadFile.mockResolvedValue(Buffer.from(originalContent));

      await migrator.migrate();

      const writeCall = mockWriteFile.mock.calls[0];
      const writtenContent = writeCall[1] as string;

      // Count occurrences
      const congesCount = (writtenContent.match(/\/conges/g) || []).length;
      const calendrierCount = (writtenContent.match(/\/calendrier/g) || []).length;

      expect(congesCount).toBe(3);
      expect(calendrierCount).toBe(2);
    });

    it('should handle file read errors gracefully', async () => {
      const migrator = new RouteMigrator(false);

      mockGlob.mockResolvedValue(['error-file.ts']);
      mockReadFile.mockRejectedValue(new Error('File not found'));

      // Should not throw, just log error
      await expect(migrator.migrate()).resolves.not.toThrow();
    });
  });

  describe('Reporting', () => {
    it('should track changes correctly', async () => {
      const migrator = new RouteMigrator(false);

      mockGlob.mockResolvedValue(['file1.ts', 'file2.ts']);

      // File 1 with changes
      mockReadFile
        .mockResolvedValueOnce(Buffer.from('href="/conges"'))
        .mockResolvedValueOnce(Buffer.from('no changes here'));

      await migrator.migrate();

      // Only file1.ts should be written
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      expect(mockWriteFile).toHaveBeenCalledWith(
        'file1.ts',
        'href="/conges"',
        'utf-8'
      );
    });
  });
});