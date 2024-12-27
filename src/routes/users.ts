import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import knex from "knex";
import { knexInstance } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function usersRoute(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const users = await knexInstance("users").select("*");

      return users;
    }
  );

  app.post("/create-user", async (request, reply) => {
    const createUserBodySchema = z.object({
      email: z.string(),
      password: z.string(), //Nao irei tratar o password com criptografia
    });

    const { email, password } = createUserBodySchema.parse(request.body);

    let sessionId = request.cookies.session_id;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      reply.cookie("session_id", sessionId, {
        path: "/",
        maxAge: 60 * 24 * 7, // 7 Days
      });
    }
    await knexInstance("users").insert({
      id: crypto.randomUUID(),
      email,
      password,
      session_id: sessionId,
    });

    return reply.status(201).send("Registro enviado com sucesso!");
  });
}
