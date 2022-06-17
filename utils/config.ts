export const QUERY_PORT = 1000;
export const CHAIN_PORT = 1001;
export const MARKET_PORT = 1002;

export const MONGO_PORT = 27017;
export const REDIS_PORT = 6379;

export type TFrom = 'market' | 'chain';
export type TTokens = 'KAR' | 'KSM' | 'BNC' | 'DOT' | 'PHA' | 'RMRK' | 'PCX' | 'EDG' | 'ACA' | 'KINT' | 'QTZ'| 'MOVR' | 'USDT' | 'WBNB' | 'BTC' | 'CSM' | 'USDC' | 'GLMR' | 'KMA' | 'TEER' | 'CRAB';

export const ALLOW_TOKENS: (TTokens | string)[] = ['KAR', 'KSM', 'BNC', 'DOT', 'PHA', 'RMRK', 'PCX', 'EDG', 'ACA', 'KINT', 'QTZ', 'MOVR', 'USDT', 'WBNB', 'BTC', 'CSM', 'USDC', 'GLMR', 'KMA', 'TEER', 'CRAB'];
export const TOKENS_MAP: { [k in (TTokens | string)]: number } = {
  KAR: 5034,
  KSM: 10042,
  BNC: 8705,
  DOT: 6636,
  PHA: 6841,
  RMRK: 12140,
  PCX: 4200,
  EDG: 5274,
  ACA: 6756,
  KINT: 13675,
  QTZ: 13685,
  MOVR: 9285,
  USDT: 825,
  WBNB: 7192,
  BTC: 1,
  CSM: 10055,
  USDC: 3408,
  GLMR: 6836,
  KMA: 15305,
  TEER: 13323,
  CRAB: 9243
}
export const CMC_API_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
export const CMC_API_URL_EXCHANGE = "https://pro-api.coinmarketcap.com/v1/tools/price-conversion";