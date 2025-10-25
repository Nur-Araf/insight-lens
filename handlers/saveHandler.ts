import { Storage } from "@plasmohq/storage"

const storage = new Storage()

/**
 * Save code snippet with a given name.
 * Each save is stored under key `savedCodes`.
 */
export const saveCodeSmart = async (
  name: string,
  code: string
): Promise<void> => {
  try {
    const savedCodes =
      (await storage.get<Record<string, string>>("savedCodes")) || {}
    savedCodes[name] = code
    await storage.set("savedCodes", savedCodes)
    console.log(`[InsightLens] Saved code under name: ${name}`)
  } catch (error) {
    console.error("[InsightLens] Failed to save code:", error)
    throw new Error("Failed to save code")
  }
}

/**
 * Optional helper to get all saved codes.
 */
export const getAllSavedCodes = async (): Promise<Record<string, string>> => {
  return (await storage.get<Record<string, string>>("savedCodes")) || {}
}

export const deleteSavedCodeSmart = async (name: string): Promise<void> => {
  try {
    const savedCodes =
      (await storage.get<Record<string, string>>("savedCodes")) || {}
    delete savedCodes[name]
    await storage.set("savedCodes", savedCodes)
    console.log(`[InsightLens] Deleted code under name: ${name}`)
  } catch (error) {
    console.error("[InsightLens] Failed to delete code:", error)
    throw new Error("Failed to delete code")
  }
}