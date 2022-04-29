import { Token, TokenPair } from "@acala-network/sdk-core";
import { server } from "./index";
import { writeTradingPairs } from "./writeToDb";

export const fetchTradingPairs = async () => {
  const api = server.getApi();
  const wallet = server.getWallet();

  if (!api || !wallet) return;

  try {
    const tpStatuses = await api.query.dex.tradingPairStatuses.entries();

    const enabled = tpStatuses.filter((item) => (item[1] as any).isEnabled);

    if (enabled) {
      const result = enabled.map((item) => {
        const primitivePair = api.createType(
          "AcalaPrimitivesTradingPair" as any,
          item[0].args[0]
        );
        const tokenPair = new TokenPair(
          wallet.__getToken(primitivePair[0]) as Token,
          wallet.__getToken(primitivePair[1]) as Token
        );
        const [token1, token2] = tokenPair.getPair();
        return {
          ticker_id: `${token1.symbol}_${token2.symbol}`,
          base: token1.symbol,
          target: token2.symbol,
        };
      });
      await writeTradingPairs(server.getRedisClient(), result);
      console.log("Updated Token Pairs");
    }
  } catch (err) {
    console.error(err);
    return setTimeout(() => {
      fetchTradingPairs();
    }, 1000);
  }
};
