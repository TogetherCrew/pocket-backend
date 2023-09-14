import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
  versionKey: false,
  timestamps: false,
  collection: CoinGecko.name,
})
export class CoinGecko {
  @Prop({ unique: true })
  date: Date;

  @Prop()
  pokt_price: number;
}

export const CoinGeckoSchema = SchemaFactory.createForClass(CoinGecko);
