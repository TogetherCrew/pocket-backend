import { BarChartMetricResponse } from './common.interface';

export interface LiquidityMetric {
  POKT_liquidity: BarChartMetricResponse;
}

export interface CoverageRatioMetric {
  coverage_ratio: BarChartMetricResponse;
}

export interface AnnualizedYieldMetric {
  annualised_yield: BarChartMetricResponse;
}
