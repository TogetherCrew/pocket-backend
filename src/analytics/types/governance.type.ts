import { MetricsResponse } from '../interfaces/common.interface';
import {
  CollaborationMetrics,
  DaoGovernanceMetrics,
  NakamotoCoefficientMetrics,
} from '../interfaces/governance.interface';

export type NakamotoCoefficientMetricsResponse =
  MetricsResponse<NakamotoCoefficientMetrics>;

export type CollaborationMetricsResponse =
  MetricsResponse<CollaborationMetrics>;

export type DaoGovernanceMetricsResponse =
  MetricsResponse<DaoGovernanceMetrics>;
