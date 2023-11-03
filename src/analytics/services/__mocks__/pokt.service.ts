export const PoktService = jest.fn().mockReturnValue({
  getLiquidityMetric: jest.fn().mockReturnValue({}),
  getCoverageRatioMetric: jest.fn().mockReturnValue({}),
  getAnnualizedYieldMetric: jest.fn().mockReturnValue({}),
});
