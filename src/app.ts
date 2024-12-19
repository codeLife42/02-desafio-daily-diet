import fastify from "fastify";
import { usersRoute } from "./routes/users";

export const app = fastify();

app.register(usersRoute, {
  prefix: "users",
});
