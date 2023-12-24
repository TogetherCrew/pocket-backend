import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
  timestamps: false,
  collection: PoktScan.name,
})
export class PoktScan {
  @Prop({ unique: true })
  date: Date;

  @Prop()
  DAO_total_balance: number;

  @Prop()
  token_burn: number;

  @Prop()
  token_issuance: number;

  @Prop()
  circulating_supply: number;

  @Prop()
  validators_to_control_protocol_count: number;

  @Prop()
  groves_relays_percentage: number;

  @Prop()
  nodies_relays_percentage: number;
}

export const PoktScanSchema = SchemaFactory.createForClass(PoktScan);
