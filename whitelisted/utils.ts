import { FixedPointNumber, Token } from "@acala-network/sdk-core";
import request, { gql } from "graphql-request";
import moment from "moment";
import { IHistoricalTrade } from "./types";

export const queryTradesWithParams = async (
  graphqlUrl: string,
  token1: Token,
  token2: Token,
  type: "buy" | "sell",
  limit: number,
  startTime?: string,
  endTime?: string
) => {
  let alreadyLoaded = 0;
  let results: IHistoricalTrade[] = [];

  while (alreadyLoaded < limit) {
    // We can only query from batches of 100 because of existing graphql configuration
    let partialToLoad =
      limit - alreadyLoaded < 100 ? limit - alreadyLoaded : 100;

    const partialResult = await request(
      graphqlUrl,
      gql`
      query {
        swaps(
          orderBy: TIMESTAMP_DESC,
          first: ${partialToLoad},
          offset: ${alreadyLoaded},
          filter: {
            token0Id: {
              equalTo: "${type === "buy" ? token1.name : token2.name}"
            },
            token1Id: {
              equalTo: "${type === "buy" ? token2.name : token1.name}"
            },
            ${
              startTime || endTime
                ? `timestamp: {
                  ${startTime ? `greaterThanOrEqualTo: "${startTime}"` : ""},
                  ${endTime ? `lessThanOrEqualTo: "${endTime}"` : ""},
                }`
                : ""
            }
          }
        )  {
          nodes {
            id
            token0Id
            token1Id
            price0
            price1
            token0InAmount
            token1OutAmount
            timestamp
          }
        }
      }
    `
    );

    console.log(`
    query {
      swaps(
        orderBy: TIMESTAMP_DESC,
        first: ${partialToLoad},
        offset: ${alreadyLoaded},
        filter: {
          token0Id: {
            equalTo: "${type === "buy" ? token1.name : token2.name}"
          },
          token1Id: {
            equalTo: "${type === "buy" ? token2.name : token1.name}"
          },
          ${
            startTime || endTime
              ? `timestamp: {
                ${startTime ? `greaterThanOrEqualTo: "${startTime}",` : ""}
                ${endTime ? `lessThanOrEqualTo: "${endTime}",` : ""}
              }`
              : ""
          }
        }
      )  {
        nodes {
          id
          token0Id
          token1Id
          price0
          price1
          token0InAmount
          token1OutAmount
          timestamp
        }
      }
    }
  `);

    if (partialResult?.swaps?.nodes?.length > 0) {
      results = results.concat(
        partialResult.swaps.nodes.map((item: any) => {
          const [idPart1, idPart2] = item.id.split("-");
          const price = FixedPointNumber.fromInner(item.price0, 18)
            .div(FixedPointNumber.fromInner(item.price1, 18))
            .toNumber();
          const base_volume = FixedPointNumber.fromInner(
            item.token0InAmount,
            token1.decimals
          ).toNumber();
          const target_volume = FixedPointNumber.fromInner(
            item.token1OutAmount,
            token2.decimals
          ).toNumber();

          return {
            id: Number(`9${idPart1}9${idPart2}`),
            price,
            base_volume,
            target_volume,
            trade_timestamp: moment(item.timestamp).unix().toString(),
            type,
          };
        })
      );

      if (partialResult.swaps.nodes.length < partialToLoad) {
        break;
      } else {
        alreadyLoaded += partialResult.swaps.nodes.length;
      }
    } else {
      break;
    }
  }

  return results;
};
