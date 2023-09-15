import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
  versionKey: false,
  timestamps: false,
  collection: SnapShot.name,
})
export class SnapShot {
  @Prop({ unique: true })
  date: Date;

  @Prop()
  community_proposals_count: number;

  @Prop()
  core_proposals_count: number;

  @Prop()
  votes_count: number;

  @Prop()
  voters_count: number;
}

export const SnapShotSchema = SchemaFactory.createForClass(SnapShot);
