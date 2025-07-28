import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: ".env"})

const ENVSchema = z.object({
    DB_NAME: z.string(),
    DB_HOST: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_PORT: z.string().transform(Number),
    JWT_SECRET: z.string(),
    SERVER_PORT: z.string().transform(Number),
});

const env = ENVSchema.parse(process.env);

export default env;