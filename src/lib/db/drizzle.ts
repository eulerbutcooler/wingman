import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as userSchema from './schema/users';
import * as chatSchema from './schema/chats';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const schema = { ...userSchema, ...chatSchema };

export const db = drizzle(pool, { schema });
