import { Client, Account, ID, TablesDB, Query } from "appwrite";
import { defaultCredits } from "./consts";
// Setup Appwrite client
const client = new Client()
  .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT!) // e.g., https://cloud.appwrite.io/v1
  .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const table = new TablesDB(client);

const DATABASE_ID = import.meta.env.PUBLIC_APPWRITE_DB!;
const CREDITS_TABLE = import.meta.env.PUBLIC_APPWRITE_TABLE!;

// Ensure we get the string userID
function resolveUserID(userID: string) {
  if (!userID) throw new Error("No user ID provided");
  return userID;
}

// Get a user's row by userID
export async function getUserInfo(userID: string): Promise<any> {
  const id = resolveUserID(userID);
  try {
    const response = await table.listRows(DATABASE_ID, CREDITS_TABLE, [
      Query.equal("user_id", id!)
    ]); if (response.total > 0) {
      return response.rows[0];
      
    }
    // No account found → create one
    return await createCreditAccount(userID);
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    throw error;
  }
}

// Check if a user exists
export async function isUserInDB(userID: string) {
  const user = await getUserInfo(userID);
  return !!user;
}

// Create a new user row if it doesn't exist
export async function createCreditAccount(userID: string) {
  const id = resolveUserID(userID);
  const existing = await getUserInfo(id!);
  if (existing) return existing;

  try {
    const response = await table.createRow(DATABASE_ID, CREDITS_TABLE, ID.unique(), {
      user_id: id,
      credits: defaultCredits,
    });
    return response;
  } catch (error) {
    console.error("Failed to create credit account:", error);
    throw error;
  }
}

// Add or update a Figma file for a user
export async function addFigmaFile(userID: string, url: string) {
  const id = resolveUserID(userID);
  let userRow = await getUserInfo(id!);

  if (!userRow) {
    userRow = await createCreditAccount(id!);
  }

  try {
    const response = await table.updateRow(DATABASE_ID, CREDITS_TABLE, userRow.$id, {
      figmaURL: url,
    });
    return response;
  } catch (error) {
    console.error("Failed to add Figma file:", error);
    throw error;
  }
}

// Update credits for a user
export async function updateCredits(userID: string) {
  const id = resolveUserID(userID);
  const userRow = await getUserInfo(id!);
  if (!userRow) throw new Error("User not found");

  const newCredits = (userRow.credits - 1 || 0);

  try {
    const response = await table.updateRow(DATABASE_ID, CREDITS_TABLE, userRow.$id, {
      credits: newCredits,
    });
    return response;
  } catch (error) {
    console.error("Failed to update credits:", error);
    throw error;
  }
}


// Reset credits for a user
export async function resetCredits(userID: string) {
  const id = resolveUserID(userID);
  const userRow = await getUserInfo(id!);
  if (!userRow) throw new Error("User not found");

  const newCredits = defaultCredits;

  try {
    const response = await table.updateRow(DATABASE_ID, CREDITS_TABLE, userRow.$id, {
      credits: newCredits,
    });
    return response;
  } catch (error) {
    console.error("Failed to reset credits:", error);
    throw error;
  }
}