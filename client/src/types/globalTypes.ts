import { type Dayjs } from "dayjs"
import { type DocumentData, type DocumentReference } from "firebase/firestore"
import type { FunctionComponent, ReactNode } from "react"

export type Obj = Record<string, unknown>
export type ReactChild = ReactNode
export type Component<T> = FunctionComponent<T & ReactChild>

export type Uuid = string
export type Email = string
export type PhoneNumber = string

export type FirebaseRefPath = string

export type FirebaseDocRef<T extends DocumentData> = DocumentReference<T>


export type Enum<T> = keyof T
export type EnumValues<T> = T[keyof T]

export type IsoDate = string
export type Dayjs = Dayjs

export type TypesafeAny =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | TypesafeAny[]

export type GenericObject = Record<string, TypesafeAny> & { id?: string }

export function invariant(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(`Invariant failed: ${message}`)
  }
}
