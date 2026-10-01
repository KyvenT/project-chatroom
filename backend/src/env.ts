import { z } from "zod";
import dotenv from "dotenv";

// a local .env fills in variables the environment hasn't set; hosts like
// Render set them directly and have no .env, which is fine
dotenv.config({ path: ".env", quiet: true });

const ENVSchema = z.object({
  DEV_DB_NAME: z.string(),
  DEV_DB_HOST: z.string(),
  DEV_DB_USERNAME: z.string(),
  DEV_DB_PASSWORD: z.string(),
  DEV_DB_PORT: z.string().transform(Number),
  DEV_DB_URL: z.string(),
  JWT_EXPIRATION: z.string(),
  JWT_SECRET: z.string(),
  SERVER_PORT: z.string().transform(Number),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_URL: z.string(),
  // comma-separated origins allowed to call the API from another site, like
  // the Vite dev server; unset in production, where the backend serves the
  // frontend itself
  CORS_ORIGIN: z.string().optional(),
});

const env = ENVSchema.parse(process.env);

export default env;
