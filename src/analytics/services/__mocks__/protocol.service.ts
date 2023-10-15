export const ProtocolService = jest.fn().mockReturnValue({
  getProtocolUpgradeMetrics: jest.fn().mockReturnValue({}),
  getDemandMetrics: jest.fn().mockReturnValue({}),
});
