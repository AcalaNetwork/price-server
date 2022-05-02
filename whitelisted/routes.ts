import { RouteOptions } from "fastify";
import { generateLogData, postEvent } from "../utils";
import {
  queryHistoricalTrades,
  queryTickersInfo,
  queryTradingPairs,
} from "./queries";
import { HistoricalTradesQueryProps } from "./types";

export const queryRoutes: RouteOptions[] = [
  {
    method: "GET",
    url: "/pairs",
    schema: {
      querystring: {},
    },
    handler: async (req, res) => {
      const { error, data } = await queryTradingPairs();

      if (error) {
        await postEvent({
          text: JSON.stringify(generateLogData(req, res)),
          title: "Query Trading Pairs error",
          alertType: "warning",
        });
        res.code(500);
        res.send(error);
      } else {
        res.send(data);
      }
    },
  },
  {
    method: "GET",
    url: "/tickers",
    schema: {
      querystring: {},
    },
    handler: async (req, res) => {
      const { error, data } = await queryTickersInfo();

      if (error) {
        await postEvent({
          text: JSON.stringify(generateLogData(req, res)),
          title: "Query Tickers error",
          alertType: "warning",
        });
        res.code(500);
        res.send(error);
      } else {
        res.send(data);
      }
    },
  },
  {
    method: "GET",
    url: "/historical_trades",
    schema: {
      querystring: {
        type: "object",
        properties: {
          ticker_id: { type: "string" },
          type: { type: "string", enum: ["buy", "sell"] },
          limit: { type: "number" },
          start_time: { type: "string" },
          end_time: { type: "string" },
        },
        required: ["ticker_id", "type"],
      },
    },
    handler: async (req, res) => {
      const { error, data } = await queryHistoricalTrades(
        req.query as HistoricalTradesQueryProps
      );

      if (error) {
        await postEvent({
          text: JSON.stringify(generateLogData(req, res)),
          title: "Query Historical Trades error",
          alertType: "warning",
        });
        res.code(500);
        res.send(error);
      } else {
        res.send(data);
      }
    },
  },
];
