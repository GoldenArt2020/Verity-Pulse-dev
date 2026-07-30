import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import "@/lib/amplifyClient";

export const client = generateClient<Schema>();