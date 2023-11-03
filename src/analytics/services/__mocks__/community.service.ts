export const CommunityService = jest.fn().mockReturnValue({
  getAwarenessMetrics: jest.fn().mockReturnValue({}),
  getTransparencyMetrics: jest.fn().mockReturnValue({}),
  getCommunityCollaborationMetrics: jest.fn().mockReturnValue({}),
  getAdaptabilityMetrics: jest.fn().mockReturnValue({}),
});
