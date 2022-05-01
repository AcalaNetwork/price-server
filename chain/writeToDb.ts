import { set } from "../db";
import { Redis } from "ioredis";
import { ITradingPair } from "./mongoModels";

// write lastest trading pairs into redis
export const writeTradingPairs = async (
  redisClient: Redis,
  tradingPairs: ITradingPair[]
) => {
  const redisKey = "tradingPairs:latest";
  await set(redisClient, redisKey, JSON.stringify(tradingPairs), "EX", 60 * 60 * 6);

  return tradingPairs;
};
