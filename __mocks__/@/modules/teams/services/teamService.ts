export const teamService = {
  getTeamById: jest.fn().mockResolvedValue(null),
  getTeamMembers: jest.fn().mockResolvedValue([]),
  createTeam: jest.fn().mockResolvedValue({ id: 1, name: 'Test Team' }),
  updateTeam: jest.fn().mockResolvedValue({ id: 1, name: 'Updated Team' }),
  deleteTeam: jest.fn().mockResolvedValue(true),
  assignUserToTeam: jest.fn().mockResolvedValue(true),
  removeUserFromTeam: jest.fn().mockResolvedValue(true),
  getTeamsByUser: jest.fn().mockResolvedValue([]),
};

export default teamService;