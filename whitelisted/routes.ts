import { RouteOptions } from "fastify";
import { generateLogData, postEvent } from "../utils";
import { queryTradingPairs } from "./queries";

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
        res.code(400);
        res.send(error);
      } else {
        res.send(data);
      }
    },
  },
];
