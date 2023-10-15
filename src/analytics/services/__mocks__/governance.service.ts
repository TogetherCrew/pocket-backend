export const GovernanceService = jest.fn().mockReturnValue({
  getNakamotoCoefficientMetrics: jest.fn().mockReturnValue({}),
  getDaoGovernanceMetrics: jest.fn().mockReturnValue({}),
  getCollaborationMetrics: jest.fn().mockReturnValue({}),
});
