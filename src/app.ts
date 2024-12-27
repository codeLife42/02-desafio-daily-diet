import fastify from "fastify";
import { usersRoute } from "./routes/users";
import cookie from "@fastify/cookie";
import { mealsRoute } from "./routes/meals";

export const app = fastify();

app.register(cookie);

app.addHook("preHandler", async (request) => {
  console.log(`[${request.method}] - ${request.url}`);
});

app.register(usersRoute, {
  prefix: "users",
});

app.register(mealsRoute, {
  prefix: "meals",
});
