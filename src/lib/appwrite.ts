import { Client, Account } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT!) // e.g., https://cloud.appwrite.io/v1
  .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
