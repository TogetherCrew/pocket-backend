import { MetricsResponse } from '../interfaces/common.interface';
import {
  ProtocolUpgradeMetrics,
  DemandMetrics,
} from '../interfaces/protocol.interface';

export type ProtocolUpgradeMetricsResponse =
  MetricsResponse<ProtocolUpgradeMetrics>;

export type DemandMetricsResponse = MetricsResponse<DemandMetrics>;
