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
  income: number;

  @Prop()
  expense: number;

  @Prop()
  token_burn: number;

  @Prop()
  token_issuance: number;

  @Prop()
  circulating_supply: number;
}

export const PoktScanSchema = SchemaFactory.createForClass(PoktScan);
