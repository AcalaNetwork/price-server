import mongo from 'mongoose';

interface IPrice {
  price: number;
  createTime: Date;
  from: 'market' | 'chain';
  token: string;
}

const priceSchema = new mongo.Schema({
  price: {
    type: Number,
    default: 0,
  },
  token: String,
  createTime: {
    type: Date,
    default: new Date(),
    index: true
  },
  from: {
    type: String,
    enum: ['market', 'chain'],
    index: true
  },
})

export const priceModal = mongo.model<IPrice>('price', priceSchema);

interface IExchange {
  base: String;
  convert: String;
  rate: Number;
}

const exchangeSchema = new mongo.Schema({
  rate: {
    type: Number,
    default: 0,
  },
  base: String,
  convert: String,
  createTime: {
    type: Date,
    default: new Date(),
    index: true
  },
})

export const exchangeModal = mongo.model<IExchange>('exchange', exchangeSchema);