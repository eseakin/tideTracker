import {
  Auth,
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  Unsubscribe,
  User,
} from "firebase/auth"

import { ErrorType, formatError } from "#utils/textFormatters"

import Firebase from "./Firebase"
import FirebaseAnalytics from "./FirebaseAnalytics"

class FirebaseAuthSingleton {
  private readonly auth: Auth
  private readonly googleProvider: GoogleAuthProvider
  public user: User | null = null

  constructor(auth?: Auth) {
    this.auth = auth ?? Firebase.getInstance().auth
    this.googleProvider = new GoogleAuthProvider()
  }

  setAuthStateListener = (
    callback: (user: User | null) => void,
    errorCallback?: (error: string) => void
  ): Unsubscribe => {
    return onAuthStateChanged(
      this.auth,
      (user) => {
        this.user = user
        console.log("✅ Login successful => ")

        // Track user login/logout
        if (user) {
          FirebaseAnalytics.getInstance().setUserId(user.uid)
          FirebaseAnalytics.getInstance().setUserProperties({
            email: user.email,
            display_name: user.displayName,
            email_verified: user.emailVerified,
          })
        } else {
          FirebaseAnalytics.getInstance().setUserId("")
        }

        callback(user)
      },
      (error) => {
        console.error("❌ Login failed error => ", error)
        errorCallback?.(formatError(error as ErrorType))
      }
    )
  }

  signInWithEmailAndPassword = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      )
      this.user = result.user
      setPersistence(this.auth, browserLocalPersistence).then((c) => {
        console.log("✅🔥 setPersistence result => ", c)
      })

      return result
    } catch (error) {
      console.error("❌🔥 signInWithEmailAndPassword error => ", error)
      throw error
    }
  }

  signInWithGoogle = async () => {
    return signInWithPopup(this.auth, this.googleProvider)
      .then((result) => {
        console.log("✅🔥 signInWithGoogle result => ", result)
        this.user = this.auth.currentUser
        console.log("✅🔥 user => ", this.user)
      })
      .catch((error) => {
        console.error("❌🔥 signInWithGoogle error => ", error)
        throw error
      })
  }

  signOut = async () => {
    return signOut(this.auth)
  }
}

class FirebaseAuth {
  private static instance: FirebaseAuthSingleton | null = null

  constructor(auth: Auth) {
    if (FirebaseAuth.instance == null) {
      FirebaseAuth.instance = new FirebaseAuthSingleton(auth)
    }
  }

  public static getInstance(): FirebaseAuthSingleton {
    if (FirebaseAuth.instance == null) {
      FirebaseAuth.instance = new FirebaseAuthSingleton(
        Firebase.getInstance().auth
      )
    }
    return FirebaseAuth.instance
  }
}

export default FirebaseAuth
