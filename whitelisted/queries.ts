import { get, set } from "../db";
import { server } from "./index";
import { tradingPairsModel } from "../chain/mongoModels";

export const queryTradingPairs = async () => {
  const redisKey = "tradingPairs:latest";
  const redisClient = server.getRedisClient();

  try {
    const redisPairs = await get(redisClient, redisKey);
    if (!redisPairs) {
      const dbPairs = await tradingPairsModel
        .find({})
        .sort({ createTime: -1 })
        .limit(1);
      if (!dbPairs || dbPairs.length === 0) {
        return {
          error: "No data",
        };
      } else {
        const pairs = dbPairs[0].pairs.map((item) => ({
          ticker_id: item.ticker_id,
          base: item.base,
          target: item.target,
        }));
        await set(redisClient, redisKey, JSON.stringify(pairs), "EX", 60);
        return {
          data: pairs,
        };
      }
    } else {
      return {
        data: JSON.parse(redisPairs),
      };
    }
  } catch (error: any) {
    return {
      error: error.toString(),
    };
  }
};
