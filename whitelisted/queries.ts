import { get, set } from "../db";
import { server } from "./index";
import { tradingPairsModel } from "../chain/mongoModels";

export const queryTradingPairs = async () => {
  const redisKey = "tradingPairs:latest";
  const redisClient = server.getRedisClient();

  try {
    const redisPairs = await get(redisClient, redisKey);
    if (!redisPairs) {
      return {
        error: "No data",
      };
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
