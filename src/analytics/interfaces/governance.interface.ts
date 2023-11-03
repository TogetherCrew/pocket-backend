import {
  BarChartMetricResponse,
  StackedChartMetricResponse,
} from './common.interface';

export interface NakamotoCoefficientMetrics {
  validators_to_control_protocol: BarChartMetricResponse;
  voters_to_control_DAO: BarChartMetricResponse;
}

export interface CollaborationMetrics {
  proposals_from_community_v_core_contributors: StackedChartMetricResponse;
}

export interface DaoGovernanceMetrics {
  DAO_governance_asset_value: BarChartMetricResponse;
  DAO_treasury: BarChartMetricResponse;
}
