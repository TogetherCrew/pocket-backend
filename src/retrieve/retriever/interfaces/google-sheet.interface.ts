import { GoogleSheetSerializedValues } from '../types/google-sheet.type';

export interface GoogleSheetOptions {
  spreadSheetID: string;
}

export interface GoogleSheetOutput {
  projects_count: GoogleSheetSerializedValues;
  projects_gave_update_count: GoogleSheetSerializedValues;
  projects_delivering_impact: GoogleSheetSerializedValues;
  velocity_of_experiments: GoogleSheetSerializedValues;
  no_debated_proposals_count: GoogleSheetSerializedValues;
  pocket_network_DNA_NPS: GoogleSheetSerializedValues;
  v1_mainnet_launch_date: GoogleSheetSerializedValues;
  voters_to_control_DAO_count: GoogleSheetSerializedValues;
  pokt_liquidity_amount: GoogleSheetSerializedValues;
  twitter_followers_count: GoogleSheetSerializedValues;
  community_NPS: GoogleSheetSerializedValues;
  voter_power_concentration_index: GoogleSheetSerializedValues;
}
