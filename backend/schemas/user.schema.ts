import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  })
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Prop([
    {
      action: String,
      timestamp: Date,
      details: Object,
    },
  ])
  activityLog: Array<{
    action: string;
    timestamp: Date;
    details: Record<string, any>;
  }>;

  @Prop({ type: Object, default: {} })
  preferences: Record<string, any>;

  @Prop({ default: Date.now })
  lastLoginDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ 'address.zipCode': 1 });