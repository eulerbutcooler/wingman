import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as userSchema from "./schema/users";
import * as chatSchema from "./schema/chats";
import * as courseSchema from "./schema/courses";
import * as quizSchema from "./schema/quizzes";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const schema = { ...userSchema, ...chatSchema, ...courseSchema, ...quizSchema };

export const db = drizzle(client, { schema });
