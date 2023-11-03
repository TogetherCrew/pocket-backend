import { MetricsResponse } from '../interfaces/common.interface';
import {
  AdaptabilityMetrics,
  AwarenessMetrics,
  CommunityCollaborationMetrics,
  TransparencyMetrics,
} from '../interfaces/community.interface';

export type CommunityCollaborationMetricsResponse =
  MetricsResponse<CommunityCollaborationMetrics>;

export type AwarenessMetricsResponse = MetricsResponse<AwarenessMetrics>;

export type TransparencyMetricsResponse = MetricsResponse<TransparencyMetrics>;

export type AdaptabilityMetricsResponse = MetricsResponse<AdaptabilityMetrics>;
