import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";

export async function usersRoute(app: FastifyInstance) {
  app.get("/", async (request, reply) => {});

  app.post("/create-user", async (request, reply) => {
    const createUserBodySchema = z.object({
      id: z.string().uuid(),
      email: z.string(),
      password: z.string(), //Nao irei tratar o password como criptografia
    });

    

  });
}
