import { Server } from "..";
import { WHITELISTED_PORT } from "../utils";
import { queryRoutes } from "./routes";

export const server = new Server(WHITELISTED_PORT, "query");
server.registeRoutes(queryRoutes);

server.start(() => {
  console.log("start");
});
