import { Client, Account, ID, TablesDB, Query } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT!) // e.g., https://cloud.appwrite.io/v1
  .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const table = new TablesDB(client);

const DATABASE_ID = import.meta.env.APPWRITE_DB; // Database ID string
const CREDITS_TABLE = import.meta.env.APPWRITE_TABLE; // Table ID string
// Get a user's row by userID
export async function getUserInfo(userID: string) {
  try {
    const response = await table.listRows(DATABASE_ID, CREDITS_TABLE, [
      Query.equal("user_id", userID)
    ]);
    return response.total > 0 ? response.rows[0] : null;
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    throw error;
  }
}

// Update credits for a user
export async function updateCredits(userID: string) {
  try {
    const userRow = await getUserInfo(userID);
    let currentCredits = userRow?.credits;
    if (!userRow) throw new Error("User not found");

    const response = await table.updateRow(DATABASE_ID, CREDITS_TABLE, userRow.$id, {
      credits:currentCredits-1,
      updatedAt: new Date().toISOString()
    });

    return response;
  } catch (error) {
    console.error("Failed to update credits:", error);
    throw error;
  }
}

export async function createCreditAccount(userID: string) {
  try {
    // 1️⃣ Check if the user already has a row
    const existing = await table.listRows(DATABASE_ID, CREDITS_TABLE, [
      Query.equal("user_id", userID)
    ]);

    if (existing.total > 0) {
      // Return the existing row instead of creating a new one
      return existing.rows[0];
    }

    // 2️⃣ If not found, create a new row
    const response = await table.createRow(DATABASE_ID, CREDITS_TABLE, ID.unique(), {
      user_id: userID,
    });

    return response;
  } catch (error) {
    console.error("Failed to create credit account:", error);
    throw error;
  }
}

