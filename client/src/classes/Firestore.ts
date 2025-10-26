import {
  FirebaseStorage,
  getDownloadURL,
  getMetadata,
  listAll,
  ref,
  uploadBytesResumable,
  UploadTaskSnapshot,
} from "firebase/storage"

import Firebase from "./Firebase"

class FirestoreSingleton {
  private readonly storage: FirebaseStorage

  constructor(firestore?: FirebaseStorage) {
    this.storage = firestore ?? Firebase.getInstance().storage
  }

  uploadFile = async (
    file: File,
    path: string,
    metadata: Record<string, unknown>,
    onProgress: (snapshot: UploadTaskSnapshot) => void,
    onSuccess: (url: string) => void
  ) => {
    const storageRef = ref(this.storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file, metadata)

    const handleSuccess = async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref)
      onSuccess(url)
    }

    const handleError = (error: Error) => {
      console.error("❌ Firestore.uploadFile error => ", error)
      throw error
    }

    uploadTask.on("state_changed", onProgress, handleError, handleSuccess)
  }

  getDownloadURL = async (path: string) => {
    const storageRef = ref(this.storage, path)
    return getDownloadURL(storageRef)
  }

  getAllFiles = async (path: string) => {
    const storageRef = ref(this.storage, path)
    const files = await listAll(storageRef)
    console.log("✅🔥 files => ", files)
    const paths = files.items.map((item) => item.fullPath)
    console.log("✅🔥 paths => ", paths)
    return files
  }

  getFolderNames = async (path: string) => {
    const storageRef = ref(this.storage, path)
    const result = await listAll(storageRef)

    // Debug: log the raw prefix objects to see what properties are available
    console.log("✅🔥 raw prefixes => ", result.prefixes)
    console.log(
      "✅🔥 first prefix keys => ",
      Object.keys(result.prefixes[0] || {})
    )
    console.log("✅🔥 first prefix => ", result.prefixes[0])

    const folderInfo = result.prefixes.map((prefix) => ({
      name: prefix.name,
      fullPath: prefix.fullPath,
    }))
    console.log("✅🔥 folder info => ", folderInfo)
    return folderInfo
  }

  getAllFilesRecursive = async (path: string) => {
    const storageRef = ref(this.storage, path)
    const result = await listAll(storageRef)

    let allFiles = [...result.items]

    // Recursively get files from all subdirectories
    for (const prefix of result.prefixes) {
      const subFiles = await this.getAllFilesRecursive(prefix.fullPath)
      allFiles = [...allFiles, ...subFiles]
    }

    console.log("✅🔥 all files recursively => ", allFiles)
    return allFiles
  }

  getFilesWithUrls = async (folderPath: string = "/demoImages") => {
    const storageRef = ref(this.storage, folderPath)
    const result = await listAll(storageRef)
    console.log("✅🔥 result => ", result)

    // Get download URLs for all files in the folder
    const filesWithUrls = await Promise.all(
      result.items.map(async (fileRef) => {
        const url = await getDownloadURL(fileRef)
        return {
          name: fileRef.name,
          fullPath: fileRef.fullPath,
          url: url,
        }
      })
    )

    console.log("✅🔥 files with URLs => ", filesWithUrls)
    return filesWithUrls
  }

  getMetadata = async (path: string) => {
    const storageRef = ref(this.storage, path)
    return getMetadata(storageRef)
  }
}

class Firestore {
  private static instance: FirestoreSingleton | null = null

  constructor(storage: FirebaseStorage) {
    if (Firestore.instance == null) {
      Firestore.instance = new FirestoreSingleton(storage)
    }
  }

  public static getInstance(): FirestoreSingleton {
    if (Firestore.instance == null) {
      Firestore.instance = new FirestoreSingleton(
        Firebase.getInstance().storage
      )
    }
    return Firestore.instance
  }
}

export default Firestore
