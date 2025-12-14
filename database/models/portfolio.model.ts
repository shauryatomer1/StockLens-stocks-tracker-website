import { Schema, model, models, Document } from 'mongoose';

export interface IPortfolio extends Document {
    userId: string;
    balance: number;
    totalInvested: number;
    holdings: {
        symbol: string;
        quantity: number;
        averagePrice: number;
        _id?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const PortfolioSchema = new Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        balance: { type: Number, default: 100000 },
        totalInvested: { type: Number, default: 0 },
        holdings: [
            {
                symbol: { type: String, required: true },
                quantity: { type: Number, required: true, default: 0 },
                averagePrice: { type: Number, required: true, default: 0 },
            },
        ],
    },
    { timestamps: true }
);

const Portfolio = models.Portfolio || model<IPortfolio>('Portfolio', PortfolioSchema);

export default Portfolio;
