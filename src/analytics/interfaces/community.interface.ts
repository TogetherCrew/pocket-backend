import {
  BarChartMetricResponse,
  NumberTypeMetricResponse,
  StackedChartMetricResponse,
} from './common.interface';

export interface CommunityCollaborationMetrics {
  ecosystem_projects_delivering_impact: NumberTypeMetricResponse;
  pocket_network_DNA_NPS: BarChartMetricResponse;
  community_NPS: BarChartMetricResponse;
}

export interface AwarenessMetrics {
  twitter_followers: BarChartMetricResponse;
}

export interface TransparencyMetrics {
  projects_working_in_the_open: BarChartMetricResponse;
  percentage_of_projects_self_reporting: BarChartMetricResponse;
}

export interface AdaptabilityMetrics {
  velocity_of_experiments_v_no_debated_proposals: StackedChartMetricResponse;
}
