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
        time: z
          .string()
          .datetime()
          .optional()
          .default(() => new Date().toISOString()),
        on_diet: z.boolean(),
      });

      const { name, description, on_diet } = createMealBodySchema.parse(
        request.body
      );

      let sessionId = request.cookies.session_id;

      await knexInstance("meals").insert({
        id: crypto.randomUUID(),
        name,
        description,
        time: new Date(),
        on_diet,
        user_session_id: sessionId,
      });

      return reply.status(201).send("Registro enviado com sucesso!");
    }
  );

  app.get(
    "/:id",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      });

      let sessionId = request.cookies.session_id;

      const { id } = getTransactionParamsSchema.parse(request.params);

      console.log(id);
      const meal = await knexInstance("meals")
        .select("*")
        .where("id", id)
        .first();

      if (meal === undefined)
        return reply.status(400).send("Registro nao encontrado.");

      if (meal.user_session_id === sessionId) {
        return { meal };
      }

      return reply.status(400).send("Usuario nao autorizado!");
    }
  );

  app.delete(
    "/:id",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealIdToDeleteSchema = z.object({
        id: z.string().uuid(),
      });

      const getUserSessionIdSchema = z.object({
        user_session_id: z.string().uuid(),
      });
      //Id do registro
      const { id } = getMealIdToDeleteSchema.parse(request.params);
      //Id da session
      let sessionId = request.cookies.session_id;

      try {
        const result = await knexInstance("meals")
          .delete()
          .where("id", id)
          .andWhere("user_session_id", sessionId);

        if (result !== 0) {
          reply.status(200).send("Registro deletado");
        }

        return reply.status(404).send("Registro nao encontrado");
      } catch (error) {
        reply.status(400).send("Erro ao deletar registro: " + error);
      }
    }
  );
  app.patch(
    "/:id",
    { preHandler: checkSessionIdExists },
    async (request, reply) => {
      const { id } = request.params;

      const { name, description, time, on_diet } = request.body || {};

      console.log(name);

      if (
        on_diet === undefined &&
        name === undefined &&
        description === undefined &&
        time === undefined
      ) {
        return reply.status(400).send("Nenhum campo enviado!");
      }

      let sessionId = request.cookies.session_id;

      const updateData = {};

      if (on_diet !== undefined) updateData.on_diet = on_diet;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (time !== undefined) updateData.time = time;

      const meal = await knexInstance("meals")
        .select("*")
        .where("id", id)
        .first();

      if (meal.user_session_id === sessionId && meal !== null) {
        console.log("Entrou aqui!");
        await knexInstance("meals").where("id", id).update(updateData);

        const updatedMeal = await knexInstance("meals").where("id", id).first();

        reply.status(200).send(updatedMeal);
      }

      reply.status(400).send("Nao foi possivel deletar registro.");
    }
  );

  app.get(
    "/metrics",
    { preHandler: checkSessionIdExists },
    async (request, reply) => {
      let sessionId = request.cookies.session_id;

      const userData = await knexInstance("meals")
        .select("*")
        .where("user_session_id", sessionId);

      //Quantidade de refeicoes
      let mealsQuantity = userData.length;
      //Refeicoes na dieta
      let mealOnDiet = 0;
      //Refeicoes fora da dieta
      let mealOffDiet = 0;
      //Melhor sequencia
      let bestSequence = 0;
      //Melhor sequencia indicador
      let bestSequenceIndicator = 0;

      userData.forEach((meal) => {
        if (meal.on_diet) {
          mealOnDiet++;
          bestSequenceIndicator++;
        } else {
          mealOffDiet++;
          if (bestSequence < bestSequenceIndicator) {
            bestSequence = bestSequenceIndicator;
          }
          bestSequenceIndicator = 0;
        }
      });

      if (bestSequenceIndicator > bestSequence) {
        bestSequence = bestSequenceIndicator;
      }

      console.log(userData);

      reply
        .status(200)
        .send(
          "Quantidade de refeicoes registradas: " +
            mealsQuantity +
            "\nRefeicoes na dieta: " +
            mealOnDiet +
            "\nRefeicoes fora da dieta: " +
            mealOffDiet +
            "\nMelhor sequencia da dieta: " +
            bestSequence
        );
    }
  );
}
