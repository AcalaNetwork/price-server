import mongo from "mongoose";

export interface ITradingPairs {
  pairs: [ITradingPair];
  createTime: Date;
}

export interface ITradingPair {
  ticker_id: string;
  base: string;
  target: string;
}

const tradingPairsSchema = new mongo.Schema({
  pairs: [
    {
      ticker_id: String,
      base: String,
      target: String,
    },
  ],
  createTime: {
    type: Date,
    default: new Date(),
    index: true,
  },
});

export const tradingPairsModel = mongo.model<ITradingPairs>(
  "tradingPairs",
  tradingPairsSchema
);
