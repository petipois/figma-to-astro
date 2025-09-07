import { Client, Account, ID } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT!) // e.g., https://cloud.appwrite.io/v1
  .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);

export async function registerUser(
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string
) {
  try {
    // Create the user account
    const user = await account.create(
      ID.unique(), 
      email, 
      password, 
      `${firstName} ${lastName}`
    );
    
    // Optionally, you can update user preferences or create additional profile data
    // await account.updatePrefs({
    //   firstName,
    //   lastName
    // });
    
    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.error("Error logging out user:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function updateUserPreferences(prefs: Record<string, any>) {
  try {
    return await account.updatePrefs(prefs);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
}