import { get } from "../db";
import { server } from "./index";
import { request, gql } from "graphql-request";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { HistoricalTradesQueryProps, ITickerInfo } from "./types";
import moment from "moment";
import { queryTradesWithParams } from "./utils";

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

export const queryTickersInfo = async () => {
  const wallet = server.getWallet();

  if (!wallet)
    return {
      error: "No wallet api connection",
    };

  try {
    const graphqlUrl = process.env.KARURA_DEX_GRAPHQL;

    if (!graphqlUrl) {
      return {
        error: "No graphql endpoint",
      };
    }

    const result = await request(
      graphqlUrl,
      gql`
        query {
          pools {
            nodes {
              id
              token0Id
              token1Id
              token0Price
              token1Price
              hourlyData(orderBy: TIMESTAMP_DESC, first: 24) {
                nodes {
                  hourlyToken0TradeVolume
                  hourlyToken1TradeVolume
                  token0High
                  token0Low
                }
              }
            }
          }
        }
      `
    );

    if (!result?.pools?.nodes) {
      return {
        error: "No data returned",
      };
    }

    const finalResult: ITickerInfo[] = [];

    for (const item of result.pools.nodes) {
      const token1 = wallet.__getToken(item.token0Id);
      const token2 = wallet.__getToken(item.token1Id);
      const lastPrice = FixedPointNumber.fromInner(
        item.token0Price,
        18
      ).toNumber();
      const dailyValues = item.hourlyData.nodes.reduce(
        (lastValue: any, innerItem: any) => {
          const numCurrentHigh = FixedPointNumber.fromInner(
            innerItem.token0High,
            18
          ).toNumber();
          const numCurrentLow = FixedPointNumber.fromInner(
            innerItem.token0Low,
            18
          ).toNumber();

          return {
            highPrice:
              lastValue.highPrice < numCurrentHigh
                ? numCurrentHigh
                : lastValue.highPrice,
            lowPrice:
              !lastValue.lowPrice || lastValue.lowPrice > numCurrentLow
                ? numCurrentLow
                : lastValue.lowPrice,
            volumeToken1:
              lastValue.volumeToken1 +
              FixedPointNumber.fromInner(
                innerItem.hourlyToken0TradeVolume,
                token1?.decimals
              ).toNumber(),
            volumeToken2:
              lastValue.volumeToken2 +
              FixedPointNumber.fromInner(
                innerItem.hourlyToken1TradeVolume,
                token2?.decimals
              ).toNumber(),
          };
        },
        {
          highPrice: 0,
          lowPrice: 0,
          volumeToken1: 0,
          volumeToken2: 0,
        }
      );

      const auxPoolData: ITickerInfo = {
        ticker_id: `${token1?.symbol}_${token2?.symbol}`,
        base_currency: token1?.symbol || "",
        target_currency: token2?.symbol! || "",
        last_price: lastPrice,
        base_volume: dailyValues.volumeToken1,
        target_volume: dailyValues.volumeToken2,
        bid: lastPrice,
        ask: lastPrice,
        high: dailyValues.highPrice,
        low: dailyValues.lowPrice,
      };

      finalResult.push(auxPoolData);
    }

    return {
      data: finalResult,
    };
  } catch (error: any) {
    return {
      error: error.toString(),
    };
  }
};

export const queryHistoricalTrades = async (
  queryParams: HistoricalTradesQueryProps
) => {
  const api = server.getApi();
  const wallet = server.getWallet();

  if (!api || !wallet)
    return {
      error: "No wallet api connection",
    };

  try {
    const graphqlUrl = process.env.KARURA_DEX_GRAPHQL;

    if (!graphqlUrl) {
      return {
        error: "No graphql endpoint",
      };
    }

    const {
      ticker_id: tickerId,
      type,
      limit,
      start_time: startTime,
      end_time: endTime,
    } = queryParams;

    const [tokenName1, tokenName2] = tickerId.split("_");
    const token1 = wallet.__getToken(tokenName1);
    const token2 = wallet.__getToken(tokenName2);

    if (!token1 || !token2) {
      return {
        error: "Invalid tokens on ticker",
      };
    }

    const convertLimit = limit === 0 ? 5000 : limit === undefined ? 100 : limit;
    let startTimeConverted, endTimeConverted;
    if (startTime) {
      startTimeConverted = /^\d+$/.test(startTime)
        ? moment.unix(Number(startTime)).format("YYYY-MM-DDTHH:mm:ss.SSS")
        : moment(startTime).format("YYYY-MM-DDTHH:mm:ss.SSS");
    }
    if (endTime) {
      endTimeConverted = /^\d+$/.test(endTime)
        ? moment.unix(Number(endTime)).format("YYYY-MM-DDTHH:mm:ss.SSS")
        : moment(endTime).format("YYYY-MM-DDTHH:mm:ss.SSS");
    }

    const result = await queryTradesWithParams(
      graphqlUrl,
      token1,
      token2,
      type,
      convertLimit,
      startTimeConverted,
      endTimeConverted
    );

    return {
      data: result,
    };
  } catch (error: any) {
    return {
      error: error.toString(),
    };
  }
};
