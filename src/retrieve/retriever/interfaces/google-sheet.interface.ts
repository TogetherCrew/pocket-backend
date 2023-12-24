import { GoogleSheetSerializedValues } from '../types/google-sheet.type';

export interface GoogleSheetOptions {
  spreadSheetID: string;
}

export interface GoogleSheetOutput {
  projects_working_in_open_count: GoogleSheetSerializedValues;
  projects_count: GoogleSheetSerializedValues;
  projects_gave_update_count: GoogleSheetSerializedValues;
  projects_delivering_impact: GoogleSheetSerializedValues;
  velocity_of_experiments: GoogleSheetSerializedValues;
  pocket_network_DNA_NPS: GoogleSheetSerializedValues;
  voters_to_control_DAO_count: GoogleSheetSerializedValues;
  pokt_liquidity_amount: GoogleSheetSerializedValues;
  twitter_followers_count: GoogleSheetSerializedValues;
  community_NPS: GoogleSheetSerializedValues;
  voter_power_concentration_index: GoogleSheetSerializedValues;
  budget_spend_amount: GoogleSheetSerializedValues;
  total_budget_amount: GoogleSheetSerializedValues;
}
