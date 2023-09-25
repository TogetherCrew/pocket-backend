import { MetricsResponse } from '../interfaces/common.interface';
import {
  LiquidityMetric,
  CoverageRatioMetric,
  AnnualizedYieldMetric,
} from '../interfaces/pokt.interface';

export type LiquidityMetricResponse = MetricsResponse<LiquidityMetric>;

export type CoverageRatioMetricResponse = MetricsResponse<CoverageRatioMetric>;

export type AnnualizedYieldMetricResponse =
  MetricsResponse<AnnualizedYieldMetric>;
