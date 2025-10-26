import type { DocumentData } from "firebase-admin/firestore"
import { chunk, isEmpty } from "lodash"
import { DOC_TYPES, Uuid } from "types/globalTypes"

import firebaseAdmin from "firebase-admin"
import { getFirestore } from "firebase-admin/firestore"
import { readFileSync } from "fs"
import path from "path"

let firebaseClient

export const createFirebaseClient = () => {
  try {
    if (!firebaseClient) {
      console.log("\nCreating Firebase client...")
      // Try to read from environment variable first (for Heroku)
      let firebaseServiceAccount
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log(
          "Using Firebase service account key from environment variable"
        )
        firebaseServiceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        )
      } else {
        // Fallback to file for local development
        firebaseServiceAccount = JSON.parse(
          readFileSync(path.join(__dirname, "./firebase-sdk-key.json"), "utf-8")
        )
        if (isEmpty(firebaseServiceAccount)) {
          throw new Error(
            "Couldn't find Firebase service account key! Make sure it's in the .env file or in the firebase-sdk-key.json file"
          )
        }
        console.log("Using Firebase service account key from file")
      }

      // Ensure we don't accidentally point admin SDK to local emulator unless explicitly requested
      const useEmulator = process.env.USE_FIRESTORE_EMULATOR === "true"
      if (!useEmulator && process.env.FIRESTORE_EMULATOR_HOST) {
        console.log(
          `⚠️ FIRESTORE_EMULATOR_HOST='${process.env.FIRESTORE_EMULATOR_HOST}' detected. Ignoring emulator for server admin SDK.`
        )
        delete process.env.FIRESTORE_EMULATOR_HOST
      }

      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
        projectId: firebaseServiceAccount.project_id,
      })

      firebaseClient = {
        db: getFirestore(),
        auth: firebaseAdmin.auth(),
        storage: firebaseAdmin.storage(),
        messaging: firebaseAdmin.messaging(),
      }
    }

    console.log("✅ Firebase client created successfully")
    return firebaseClient
  } catch (error) {
    console.error("❌ Error creating firebase client: ", error)
    return null
  }
}

export const getDocById = async <T extends DocumentData>(
  collection: DOC_TYPES,
  id: Uuid
) => {
  try {
    const docRef = firebaseClient.db.collection(collection).doc(id)
    const docSnapshot = await docRef.get()
    return docSnapshot.data() as T
  } catch (error) {
    console.error(
      `Error getting doc ${id} from ${String(collection)}: ${error}`
    )
    return null
  }
}

export const updateDocFields = async (
  collection: DOC_TYPES,
  id: Uuid,
  data: Record<string, unknown>
) => {
  try {
    const docRef = firebaseClient.db.collection(collection).doc(id)
    await docRef.set(data, { merge: true })
    return true
  } catch (error) {
    console.error(`Error updating doc ${id} in ${String(collection)}: ${error}`)
    return false
  }
}

export const getCollection = async <T extends DocumentData>(
  collection: DOC_TYPES
) => {
  try {
    const collectionRef = firebaseClient.db.collection(collection)
    const collectionSnapshot = await collectionRef.get()
    return collectionSnapshot.data() as T[]
  } catch (error) {
    console.error(`Error getting collection ${String(collection)}: ${error}`)
    return null
  }
}

export const fetchDocsById = async <T extends DocumentData>(
  collection: DOC_TYPES,
  ids: Uuid[]
): Promise<T[]> => {
  const collectionRef = firebaseClient.db.collection(collection)

  // Firebase limits batch size to 30
  const idsChunks = chunk(ids, 30)
  const results = await Promise.all(
    idsChunks.map(async (idsChunk) => {
      const docsSnapshot = await collectionRef.where("id", "in", idsChunk).get()

      const docs: T[] = []
      docsSnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as T)
      })
      return docs
    })
  )
  return results.flat()
}
