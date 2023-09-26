import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type GoogleSheetMetricsName =
  | 'projects_working_in_open_count'
  | 'projects_count'
  | 'projects_gave_update_count'
  | 'projects_delivering_impact'
  | 'velocity_of_experiments'
  | 'no_debated_proposals_count'
  | 'pocket_network_DNA_NPS'
  | 'v1_mainnet_launch_date'
  | 'voters_to_control_DAO_count'
  | 'pokt_liquidity_amount'
  | 'twitter_followers_count'
  | 'community_NPS'
  | 'voter_power_concentration_index';

const GoogleSheetMetricsNameEnum: Array<GoogleSheetMetricsName> = [
  'projects_working_in_open_count',
  'projects_count',
  'projects_gave_update_count',
  'projects_delivering_impact',
  'velocity_of_experiments',
  'no_debated_proposals_count',
  'pocket_network_DNA_NPS',
  'v1_mainnet_launch_date',
  'voters_to_control_DAO_count',
  'pokt_liquidity_amount',
  'twitter_followers_count',
  'community_NPS',
  'voter_power_concentration_index',
];

@Schema({
  versionKey: false,
  timestamps: false,
  collection: GoogleSheet.name,
})
export class GoogleSheet {
  @Prop({ index: true })
  date: Date;

  @Prop({ index: true, enum: GoogleSheetMetricsNameEnum })
  metric_name: GoogleSheetMetricsName;

  @Prop()
  metric_value: number;
}

export const GoogleSheetSchema = SchemaFactory.createForClass(GoogleSheet);

GoogleSheetSchema.index({ date: 1, metric_name: 1 }, { unique: true });
