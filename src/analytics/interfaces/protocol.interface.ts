import {
  BarChartMetricResponse,
  StackedChartMetricResponse,
} from './common.interface';

export interface DemandMetrics {
  protocol_revenue: BarChartMetricResponse;
  gateway_operator_share_of_relays: StackedChartMetricResponse;
}
