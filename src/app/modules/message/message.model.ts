import { Schema, Types, model } from 'mongoose';
import { TMessage, TMessageModel } from './message.interface';

const messageSchema = new Schema<TMessage>(
  {
    text: {
      type: String,
      default: null,
    },
    imageUrl: [
      {
        type: String,
        default: null,
      },
    ],
    seen: {
      type: Boolean,
      default: false,
    },
    sender: {
      type: Types.ObjectId,
      required: true,
      ref: 'User',
    },
    receiver: {
      type: Types.ObjectId,
      required: true,
      ref: 'User',
    },
    chat: {
      type: Types.ObjectId,
      required: true,
      ref: 'Chat',
    },
  },
  {
    timestamps: true,
  },
);

export const Message = model<TMessage, TMessageModel>('Message', messageSchema);
