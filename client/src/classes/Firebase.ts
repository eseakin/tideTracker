// import { type Analytics, getAnalytics } from "firebase/analytics"
import { message } from "antd"
import { type Analytics, getAnalytics } from "firebase/analytics"
import { type FirebaseApp, initializeApp } from "firebase/app"
import { Auth, getAuth } from "firebase/auth"
import {
  collection,
  deleteDoc,
  doc,
  type DocumentData,
  type DocumentReference,
  type Firestore as FirestoreDb,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
  runTransaction,
  setDoc,
  Transaction,
  type Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { FirebaseStorage, getStorage } from "firebase/storage"
import { forEach, noop } from "lodash"

import {
  COMPARATORS,
  DOC_TYPES,
  type FirebaseBatchUpdate,
  type FirebaseBatchUpdateResponse,
  FirebaseChange,
  type FirebaseQueryConfig,
} from "#customTypes/firebaseTypes"
import {
  type GenericObject,
  invariant,
  type Uuid,
} from "#customTypes/globalTypes"

import { stringify } from "#utils/textFormatters"
import FirebaseAnalytics from "./FirebaseAnalytics"
import FirebaseAuth from "./FirebaseAuth"
import { default as Firestore } from "./Firestore"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  apiKey: "ABCXYZ",
  authDomain: "ABCXYZ.firebaseapp.com",
  projectId: "ABCXYZ-92f41",
  storageBucket: "ABCXYZ.firebasestorage.app",
  messagingSenderId: "123",
  appId: "1:123:web:123",
  measurementId: "G-123",
}

class FirebaseSingleton {
  private readonly db: FirestoreDb
  private readonly app: FirebaseApp
  public readonly storage: FirebaseStorage
  public readonly auth: Auth
  public readonly analytics: Analytics

  constructor() {
    this.app = initializeApp(firebaseConfig)
    this.db = getFirestore(this.app)
    this.storage = getStorage(this.app)
    this.auth = getAuth(this.app)
    this.analytics = getAnalytics(this.app)

    // if (window.location.hostname === "localhost") {
    //   // connectAuthEmulator(auth, "http://localhost:9099")
    //   connectFirestoreEmulator(this.db, "localhost", 8080)
    //   this.db._settings.experimentalForceLongPolling = true // or db.settings({ experimentalForceLongPolling: true });
    //   connectStorageEmulator(this.storage, "localhost", 9199)
    // }

    // Initialize other Firebase singletons
    new Firestore(this.storage)
    new FirebaseAuth(this.auth)
    new FirebaseAnalytics(this.analytics)
  }

  getNewRef = <T>(docType: DOC_TYPES, id?: Uuid): DocumentReference<T> => {
    return id
      ? (doc(this.db, docType, id) as DocumentReference<T>)
      : (doc(collection(this.db, docType)) as DocumentReference<T>)
  }

  addDocument = async <T extends GenericObject>(
    docType: DOC_TYPES,
    submittedData: Omit<T, "id"> & { id?: Uuid }
  ): Promise<Uuid> => {
    const docRef =
      submittedData.id == null
        ? this.getNewRef(docType)
        : doc(this.db, docType, submittedData.id)

    submittedData.id = docRef.id

    invariant(
      submittedData.id != null,
      `${docType} ID does not exist. Please provide an ID.`
    )

    await setDoc(docRef, submittedData).catch((e) => {
      void message.error(stringify(e))
    })

    return docRef.id
  }

  updateDocument = async <T extends GenericObject>(
    docType: DOC_TYPES,
    id: Uuid,
    submittedData: T
  ): Promise<Uuid> => {
    const docRef = doc(this.db, docType, id)
    await updateDoc(docRef, submittedData).catch((e) => {
      void message.error(stringify(e))
    })
    return docRef.id
  }

  updateDocuments = async (
    submittedData: FirebaseBatchUpdate
  ): Promise<FirebaseBatchUpdateResponse> => {
    const batch = writeBatch(this.db)
    const updatedIds: Partial<{ [key in DOC_TYPES]: Uuid[] }> = {}

    // Process each document type separately
    forEach(submittedData, (docTypeData, docType) => {
      const docTypeEnum = docType as DOC_TYPES

      forEach(docTypeData, (itemData, id) => {
        const docRef = doc(this.db, docType, id)
        batch.update(docRef, itemData)

        // TS complains if this is outside the loop
        if (updatedIds[docTypeEnum] == null) {
          updatedIds[docTypeEnum] = []
        }

        updatedIds[docTypeEnum].push(id)
      })
    })

    await batch.commit()

    return updatedIds
  }

  getDocumentById = async <T extends DocumentData>(
    docType: DOC_TYPES,
    id: Uuid | undefined | null
  ): Promise<null | T> => {
    if (id == null) {
      return null
    }

    const docRef = doc(this.db, docType, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      void message.error(`Data not found: ${docType} with ID ${id}`)
      return null
    }

    return docSnap.data() as T
  }

  getDocumentsByIds = async <T extends DocumentData>(
    docType: DOC_TYPES,
    ids: Uuid[]
  ): Promise<T[]> => {
    if (ids.length === 0) {
      return []
    }

    const docSnaps = await getDocs(
      query(collection(this.db, docType), where("id", "in", ids))
    )

    return docSnaps.docs.map((docSnap) => docSnap.data() as T)
  }

  getDocumentByRef = async <T extends DocumentData>(
    ref: DocumentReference<DocumentData>
  ): Promise<T | null> => {
    const docSnap = await getDoc(ref)
    if (docSnap.exists()) {
      return docSnap.data() as T
    }
    console.log(`🔥 No such document! ${ref.path}`)
    return null
  }

  getRefById = <T extends DocumentData>(
    docType: DOC_TYPES,
    id: Uuid
  ): DocumentReference<T> => {
    const docRef = doc(this.db, docType, id)
    return docRef as DocumentReference<T>
  }

  variableQuery = async <T extends DocumentData>(
    docType: DOC_TYPES,
    queryConfig: FirebaseQueryConfig
  ): Promise<T[]> => {
    const results: T[] = []
    const wheres = []

    for (const key in queryConfig.queries) {
      const { value, comparator = COMPARATORS.EQUALS } =
        queryConfig.queries[key]
      wheres.push(where(key, comparator, value))
    }

    const queryConstraints: QueryConstraint[] = [...wheres]

    if (queryConfig.orderBy != null) {
      queryConstraints.push(
        orderBy(queryConfig.orderBy.field, queryConfig.orderBy.direction)
      )
    }

    if (queryConfig.limitCount != null) {
      queryConstraints.push(limit(queryConfig.limitCount))
    }

    const q = query(collection(this.db, docType), ...queryConstraints)
    const querySnapshot = await getDocs(q)

    querySnapshot.forEach((doc) => {
      results.push(doc.data() as T)
    })

    return results
  }

  deleteDocument = async (docType: DOC_TYPES, id: Uuid): Promise<void> => {
    await deleteDoc(doc(this.db, docType, id))
  }

  runTransaction = async <T>(
    callback: (transaction: Transaction) => Promise<T>
  ): Promise<T> => {
    return runTransaction(this.db, callback)
  }

  getAllDocsOfType = async <T extends GenericObject>(
    docType: DOC_TYPES
  ): Promise<T[]> => {
    const results: T[] = []
    const querySnapshot = await getDocs(collection(this.db, docType))

    querySnapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        results.push(docSnap.data() as T)
      }
    })

    return results
  }

  /**
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   * SUBSCRIPTIONS
   */

  createListenerForId = <T extends GenericObject>(
    docType: DOC_TYPES,
    id: string,
    callback?: (data: T | null) => void
  ): Unsubscribe => {
    if (id == null) return noop

    const ref = doc(this.db, docType, id)
    const unsubscribe = onSnapshot(
      ref,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as T
          callback?.(data)
        } else {
          callback?.(null)
        }
      },
      (err) => {
        throw new Error(err.message)
      }
    )

    return unsubscribe
  }

  createListenerForIds = <T extends GenericObject>(
    docType: DOC_TYPES,
    ids: string[],
    callback?: (changes: FirebaseChange<T>[]) => void
  ): Unsubscribe => {
    if (ids.length === 0) return noop

    const q = query(collection(this.db, docType), where("id", "in", ids))
    const unsubscribe = onSnapshot(
      q,
      (docSnapshot) => {
        // Get changes for incremental updates
        const changes =
          docSnapshot.docChanges()?.map((change) => ({
            ...change,
            doc: change.doc.data() as T,
          })) ?? []

        callback?.(changes as FirebaseChange<T>[])
      },
      (err) => {
        throw new Error(err.message)
      }
    )

    return unsubscribe
  }

  createListenerForAllDocs = <T extends GenericObject>(
    docType: DOC_TYPES,
    callback?: (changes: FirebaseChange<T>[]) => void
  ): Unsubscribe => {
    const q = query(collection(this.db, docType), where("id", "!=", null))

    const unsubscribe = onSnapshot(
      q,
      (docSnapshot) => {
        const changes =
          docSnapshot.docChanges()?.map((change) => ({
            ...change,
            doc: change.doc.data() as T,
          })) ?? []

        callback?.(changes as FirebaseChange<T>[])
      },
      (err) => {
        throw new Error(err.message)
      }
    )

    return unsubscribe
  }

  createListenerForVariableQuery = <T extends GenericObject>(
    docType: DOC_TYPES,
    queryConfig: FirebaseQueryConfig,
    callback?: (changes: FirebaseChange<T>[]) => void
  ): Unsubscribe => {
    const wheres: QueryConstraint[] = []

    if (queryConfig.queries) {
      for (const key in queryConfig.queries) {
        const { value, comparator = COMPARATORS.EQUALS } =
          queryConfig.queries[key]

        if (value === undefined || (Array.isArray(value) && !value?.length)) {
          continue
        }

        if (comparator === COMPARATORS.BETWEEN) {
          if (!Array.isArray(value))
            throw new Error("BETWEEN comparator requires an array")

          const [start, end] = value as [string, string]
          wheres.push(
            where(key, COMPARATORS.GREATER_OR_EQUALS, start),
            where(key, COMPARATORS.LESS_OR_EQUALS, end)
          )
          continue
        }

        wheres.push(where(key, comparator, value))
      }
    }

    if (queryConfig.orderBy != null) {
      wheres.push(
        orderBy(queryConfig.orderBy.field, queryConfig.orderBy.direction)
      )
    }

    if (queryConfig.limitCount != null) {
      wheres.push(limit(queryConfig.limitCount))
    }

    const q = query(collection(this.db, docType), ...wheres)
    const unsubscribe = onSnapshot(
      q,
      (docSnapshot) => {
        // Get changes for incremental updates
        const changes =
          docSnapshot.docChanges()?.map((change) => ({
            ...change,
            doc: change.doc.data() as T,
          })) ?? []

        callback?.(changes as FirebaseChange<T>[])
      },
      (err) => {
        throw new Error(err.message)
      }
    )

    return unsubscribe
  }
}

export default class Firebase {
  private static instance: FirebaseSingleton | null = null

  constructor() {
    if (Firebase.instance == null) {
      Firebase.instance = new FirebaseSingleton()
    }
  }

  public static getInstance(): FirebaseSingleton {
    if (Firebase.instance == null) {
      Firebase.instance = new FirebaseSingleton()
    }
    return Firebase.instance
  }
}

export const getRef = Firebase.getInstance().getDocumentByRef
