import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import knex from "knex";
import { knexInstance } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function mealsRoute(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      let sessionId = request.cookies.session_id;
      const meals = await knexInstance("meals")
        .select("*")
        .where("user_session_id", sessionId);

      return meals;
    }
  );

  app.post(
    "/create-meal",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        time: z.string().datetime(),
        on_diet: z.boolean(),
      });

      const { name, description, on_diet } = createMealBodySchema.parse(
        request.body
      );

      let sessionId = request.cookies.session_id;

      console.log(name, description, on_diet, sessionId);

      await knexInstance("meals").insert({
        id: crypto.randomUUID(),
        name,
        description,
        time: new Date(),
        on_diet,
        session_id: sessionId,
      });

      return reply.status(201).send("Registro enviado com sucesso!");
    }
  );
}
