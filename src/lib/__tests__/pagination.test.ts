import { 
  calculatePagination,
  getPaginationInfo,
  buildPaginationQuery,
  validatePaginationParams
} from '../pagination';

describe('pagination', () => {
  describe('calculatePagination', () => {
    it('should calculate basic pagination', () => {
      const result = calculatePagination(100, 1, 10);
      
      expect(result).toEqual({
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
        offset: 0,
        hasNext: true,
        hasPrev: false
      });
    });

    it('should handle last page', () => {
      const result = calculatePagination(25, 3, 10);
      
      expect(result).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        offset: 20,
        hasNext: false,
        hasPrev: true
      });
    });

    it('should handle edge cases', () => {
      const result = calculatePagination(0, 1, 10);
      
      expect(result.totalPages).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('getPaginationInfo', () => {
    it('should return pagination metadata', () => {
      const result = getPaginationInfo(50, 2, 10);
      
      expect(result).toHaveProperty('currentPage', 2);
      expect(result).toHaveProperty('itemsPerPage', 10);
      expect(result).toHaveProperty('totalItems', 50);
      expect(result).toHaveProperty('startIndex', 10);
      expect(result).toHaveProperty('endIndex', 19);
    });
  });

  describe('buildPaginationQuery', () => {
    it('should build query string', () => {
      const result = buildPaginationQuery(2, 20);
      
      expect(result).toContain('page=2');
      expect(result).toContain('limit=20');
    });

    it('should handle additional params', () => {
      const result = buildPaginationQuery(1, 10, { search: 'test', sort: 'name' });
      
      expect(result).toContain('search=test');
      expect(result).toContain('sort=name');
    });
  });

  describe('validatePaginationParams', () => {
    it('should validate valid params', () => {
      const result = validatePaginationParams(1, 10);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid page', () => {
      const result = validatePaginationParams(0, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Page must be >= 1');
    });

    it('should reject invalid limit', () => {
      const result = validatePaginationParams(1, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Limit must be >= 1');
    });

    it('should reject excessive limit', () => {
      const result = validatePaginationParams(1, 1000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Limit too high');
    });
  });
});