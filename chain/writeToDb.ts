import { set } from "../db";
import { Redis } from "ioredis";
import { ITradingPair, tradingPairsModel } from "./mongoModels";

// write lastest trading pairs into db and update redis
export const writeTradingPairs = async (
  redisClient: Redis,
  tradingPairs: ITradingPair[],
  time?: string | Date
) => {
  const redisKey = "tradingPairs:latest";
  await tradingPairsModel.create({
    pairs: tradingPairs,
    createTime: time,
  });
  await set(redisClient, redisKey, JSON.stringify(tradingPairs), "EX", 60 * 30);

  return tradingPairs;
};
