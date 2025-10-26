import {
  Analytics,
  logEvent,
  setDefaultEventParameters,
  setUserId,
  setUserProperties,
} from "firebase/analytics"

import { DOC_TYPES } from "#customTypes/firebaseTypes"

import Firebase from "./Firebase"

// Analytics event constants
export const ANALYTICS_EVENTS = {} as const

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

class FirebaseAnalyticsSingleton {
  private readonly analytics: Analytics
  private isInitialized = false

  constructor(analytics: Analytics) {
    this.analytics = analytics
    this.initialize()
  }

  private initialize() {
    if (this.isInitialized) return

    // Set default event parameters
    setDefaultEventParameters({
      app_version: "2.0.0",
      platform: "web",
    })

    this.isInitialized = true
  }

  // Core tracking methods
  trackEvent = (
    eventName: AnalyticsEvent,
    parameters?: Record<string, unknown>
  ) => {
    if (!this.analytics) {
      console.warn("Analytics not initialized")
      return
    }

    try {
      // Track with Firebase Analytics
      logEvent(this.analytics, eventName, {
        timestamp: Date.now(),
        ...parameters,
      })

      // Also save to Firestore for backup/analysis
      this.saveEventToFirestore(eventName, parameters)
    } catch (error) {
      console.error("Analytics tracking error:", error)
    }
  }

  // Save event to Firestore as a document
  private saveEventToFirestore = async (
    eventName: AnalyticsEvent,
    parameters?: Record<string, unknown>
  ) => {
    const eventData = {
      event_name: eventName,
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
      ...parameters,
    }

    // Console log during development on localhost
    if (window.location.hostname === "localhost") {
      console.log("📊 Analytics Event (localhost):", eventData)
      return
    }

    try {
      await Firebase.getInstance().addDocument(DOC_TYPES.ANALYTICS, eventData)
    } catch (error) {
      console.error("Failed to save analytics event to Firestore:", error)
    }
  }

  // User identification
  setUserId = (userId: string) => {
    if (!this.analytics) return

    try {
      setUserId(this.analytics, userId)
    } catch (error) {
      console.error("Error setting user ID:", error)
    }
  }

  setUserProperties = (properties: Record<string, unknown>) => {
    if (!this.analytics) return

    try {
      setUserProperties(this.analytics, properties)
    } catch (error) {
      console.error("Error setting user properties:", error)
    }
  }
}

export default class FirebaseAnalytics {
  private static instance: FirebaseAnalyticsSingleton | null = null

  constructor(analytics: Analytics) {
    if (FirebaseAnalytics.instance == null) {
      FirebaseAnalytics.instance = new FirebaseAnalyticsSingleton(analytics)
    }
  }

  public static getInstance(): FirebaseAnalyticsSingleton {
    if (FirebaseAnalytics.instance == null) {
      FirebaseAnalytics.instance = new FirebaseAnalyticsSingleton(
        Firebase.getInstance().analytics
      )
    }
    return FirebaseAnalytics.instance
  }
}
