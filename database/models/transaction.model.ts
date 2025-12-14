import { Schema, model, models, Document } from 'mongoose';

export interface ITransaction extends Document {
    userId: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    totalAmount: number;
    date: Date;
}

const TransactionSchema = new Schema({
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const Transaction = models.Transaction || model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
