import { Schema, model, Document, type Model } from "mongoose";

export interface IUserConsent {
  audioProcessing: boolean;
  retainAudio: boolean;
  timestamp: Date;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  consent: IUserConsent;
  createdAt: Date;
}

const userConsentSchema = new Schema<IUserConsent>(
  {
    audioProcessing: { type: Boolean, default: true },
    retainAudio: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    consent: {
      type: userConsentSchema,
      default: () => ({
        audioProcessing: true,
        retainAudio: false,
        timestamp: new Date(),
      }),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

export const User: Model<IUser> = model<IUser>("User", userSchema);
