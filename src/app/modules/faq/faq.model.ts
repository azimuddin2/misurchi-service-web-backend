import { model, Schema } from 'mongoose';
import { TFAQ } from './faq.interface';

const faqSchema = new Schema<TFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const FAQ = model<TFAQ>('FAQ', faqSchema);
