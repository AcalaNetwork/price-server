export interface ITickerInfo {
  ticker_id: string;
  base_currency: string;
  target_currency: string;
  last_price: number;
  base_volume: number;
  target_volume: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
}

export interface HistoricalTradesQueryProps {
  ticker_id: string;
  type: "buy" | "sell";
  limit?: number;
  start_time?: string;
  end_time?: string;
}

export interface IHistoricalTrade {
  trade_id: string;
  price: number;
  base_volume: number;
  target_volume: number;
  trade_timestamp: string;
  type: "buy" | "sell";
}
