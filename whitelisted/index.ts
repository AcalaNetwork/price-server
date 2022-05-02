import { Server } from "..";
import { WHITELISTED_PORT } from "../utils";
import { queryRoutes } from "./routes";

export const server = new Server(
  WHITELISTED_PORT,
  "query",
  process.env.KARURA_ENDPOINT
);
server.registeRoutes(queryRoutes);

server.start(async () => {
  await server.initiateApi();
  console.log("API successfully initiated");
});
