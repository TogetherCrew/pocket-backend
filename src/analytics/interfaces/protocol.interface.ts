import {
  BarChartMetricResponse,
  StringTypeMetricResponse,
} from './common.interface';

export interface ProtocolUpgradeMetrics {
  v1_mainnet_launch_date: StringTypeMetricResponse;
}

export interface DemandMetrics {
  protocol_revenue: BarChartMetricResponse;
  gateway_operator_share_of_relays: BarChartMetricResponse;
}
