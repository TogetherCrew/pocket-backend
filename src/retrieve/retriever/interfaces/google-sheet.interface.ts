import { GoogleSheetSerializedValues } from '../types/google-sheet.type';

export interface GoogleSheetOptions {
  spreadSheetID: string;
}

export interface GoogleSheetOutput {
  projects_working_in_open_count: Array<GoogleSheetSerializedValues>;
  projects_count: Array<GoogleSheetSerializedValues>;
  projects_gave_update_count: Array<GoogleSheetSerializedValues>;
  projects_delivering_impact: Array<GoogleSheetSerializedValues>;
  velocity_of_experiments: Array<GoogleSheetSerializedValues>;
  pocket_network_DNA_NPS: Array<GoogleSheetSerializedValues>;
  voters_to_control_DAO_count: Array<GoogleSheetSerializedValues>;
  pokt_liquidity_amount: Array<GoogleSheetSerializedValues>;
  twitter_followers_count: Array<GoogleSheetSerializedValues>;
  community_NPS: Array<GoogleSheetSerializedValues>;
  voter_power_concentration_index: Array<GoogleSheetSerializedValues>;
  budget_spend_amount: Array<GoogleSheetSerializedValues>;
  total_budget_amount: Array<GoogleSheetSerializedValues>;
}
