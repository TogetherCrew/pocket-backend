import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CompoundMetricsName =
  | 'dao_treasury'
  | 'protocol_revenue'
  | 'annualised_yield'
  | 'coverage_ratio'
  | 'voter_participation_ratio'
  | 'percentage_of_projects_self_reporting'
  | 'dao_governance_asset_value';

const CompoundMetricsNameEnum: Array<CompoundMetricsName> = [
  'dao_treasury',
  'protocol_revenue',
  'annualised_yield',
  'coverage_ratio',
  'voter_participation_ratio',
  'percentage_of_projects_self_reporting',
  'dao_governance_asset_value',
];

@Schema({
  versionKey: false,
  timestamps: false,
  collection: CompoundMetrics.name,
})
export class CompoundMetrics {
  @Prop({ index: true })
  date: Date;

  @Prop({ index: true, enum: CompoundMetricsNameEnum })
  metric_name: CompoundMetricsName;

  @Prop()
  metric_value: number;
}

export const CompoundMetricsSchema =
  SchemaFactory.createForClass(CompoundMetrics);

CompoundMetricsSchema.index({ date: 1, metric_name: 1 }, { unique: true });
