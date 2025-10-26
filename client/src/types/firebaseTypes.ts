import {
  DocumentChange,
  FieldValue,
  type WhereFilterOp,
} from "firebase/firestore"

import {
  AllSkillLevels,
  CoreSkillLevel,
  DigitalSkillLevel,
} from "#constants/skillLevelConstants"
import { ALLERGY_ICONS_BY_KEY } from "#constants/studentOptions"
import { TAG_ICONS_BY_KEY } from "#constants/tagOptions"
import { type Uuid } from "#customTypes/globalTypes"
import { AttendanceClassSession, DataWithId } from "#customTypes/types"

import { type ClassSessionConstructor } from "./classSessionTypes"
import { type ClassConstructor } from "./classTypes"
import { type CurriculumConstructor } from "./curriculumTypes"
import { type EvaluationConstructor } from "./evaluationTypes"
import { type MakeupConstructor } from "./makeupTypes"
import { type ProjectConstructor } from "./projectTypes"
import { type SemesterConstructor } from "./semesterTypes"
import { StudentTask } from "./studentTaskTypes"
import { type StudentConstructor } from "./studentTypes"
import { type TagConstructor } from "./tagTypes"
import { type TryoutConstructor } from "./tryoutTypes"
import { type UserConstructor } from "./userTypes"

export enum DOC_TYPES {
  STUDENTS = "students",
  CLASSES = "classes",
  PROJECTS = "projects",
  CURRICULUMS = "curriculums",
  TRYOUTS = "tryouts",
  MAKEUPS = "makeups",
  TAGS = "tags",
  SEMESTERS = "semesters",
  CLASS_SESSIONS = "classSessions",
  TEACHERS = "teachers",
  USERS = "users",
  QUICK_NOTES = "quickNotes",
  EVALUATIONS = "evaluations",
  EVAL_TRAITS = "evaluationTraits",
  EMAILS = "emails",
  ANALYTICS = "analytics",
}

export enum COMPARATORS {
  LESS_THAN = "<",
  LESS_OR_EQUALS = "<=",
  EQUALS = "==",
  GREATER_THAN = ">",
  GREATER_OR_EQUALS = ">=",
  DOES_NOT_EQUAL = "!=",
  NOT = "not-in",
  IN = "in",
  CONTAINS = "array-contains",
  BETWEEN = "between",
}

export type FirebaseChange<T extends DataWithId> = DocumentChange<T> & {
  doc: T
}

export interface FirebaseQueryConfig {
  queries?: Record<
    string,
    { value: unknown; comparator?: WhereFilterOp | COMPARATORS.BETWEEN }
  >
  limitCount?: number
  orderBy?: { field: string; direction: "asc" | "desc" }
}

export type FirebaseBatchUpdateClass = Omit<
  ClassConstructor,
  "teacherIds" | "sessionIds" | "assistantIds" | "studentIds"
> & {
  teacherIds?: Uuid[] | FieldValue
  sessionIds?: Uuid[] | FieldValue
  assistantIds?: Uuid[] | FieldValue
  studentIds?: Uuid[] | FieldValue
}

export type FirebaseBatchUpdateClassSession = Omit<
  ClassSessionConstructor,
  "teacherIds" | "studentIds" | "makeupIds" | "tryoutIds" | "assistantIds"
> & {
  teacherIds?: Uuid[] | FieldValue
  studentIds?: Uuid[] | FieldValue
  makeupIds?: Uuid[] | FieldValue
  tryoutIds?: Uuid[] | FieldValue
  assistantIds?: Uuid[] | FieldValue
}

export type FirebaseBatchUpdateStudent = Omit<
  StudentConstructor,
  "tags" | "allergies"
> & {
  tags?: Array<keyof typeof TAG_ICONS_BY_KEY> | FieldValue
  allergies?: Array<keyof typeof ALLERGY_ICONS_BY_KEY> | FieldValue
  tasks?: StudentTask[] | FieldValue
  attendance?: Record<Uuid, AttendanceClassSession[] | FieldValue>
}

export type FirebaseBatchUpdateProject = Omit<
  ProjectConstructor,
  "skillLevels"
> & {
  skillLevels?: AllSkillLevels[] | FieldValue
}

export type FirebaseBatchUpdateCurriculum = Omit<
  CurriculumConstructor,
  "skillLevels" | "projectIds"
> & {
  skillLevels?: CoreSkillLevel[] | DigitalSkillLevel[] | FieldValue
  projectIds?: Uuid[] | FieldValue
}

export type FirebaseBatchUpdateTryout = Omit<
  TryoutConstructor,
  | "tryoutFeeIds"
  | "tryoutDiscountIds"
  | "recommendedSessionIds"
  | "selectedSessionIds"
> & {
  tryoutFeeIds?: Uuid[] | FieldValue
  tryoutDiscountIds?: Uuid[] | FieldValue
  recommendedSessionIds?: Uuid[] | FieldValue
  selectedSessionIds?: Uuid[] | FieldValue
}

export type FirebaseBatchUpdateUser = Omit<
  UserConstructor,
  "tags" | "allergies" | "teacherAttendance"
> & {
  tags?: Array<keyof typeof TAG_ICONS_BY_KEY> | FieldValue
  allergies?: Array<keyof typeof ALLERGY_ICONS_BY_KEY> | FieldValue
  teacherAttendance?: Record<Uuid, AttendanceClassSession[] | FieldValue>
}

export type FirebaseBatchUpdate = Partial<{
  [DOC_TYPES.STUDENTS]: Record<Uuid, FirebaseBatchUpdateStudent>
  [DOC_TYPES.CLASSES]: Record<Uuid, FirebaseBatchUpdateClass>
  [DOC_TYPES.PROJECTS]: Record<Uuid, FirebaseBatchUpdateProject>
  [DOC_TYPES.CURRICULUMS]: Record<Uuid, FirebaseBatchUpdateCurriculum>
  [DOC_TYPES.EVALUATIONS]: Record<Uuid, Partial<EvaluationConstructor>>
  [DOC_TYPES.TRYOUTS]: Record<Uuid, FirebaseBatchUpdateTryout>
  [DOC_TYPES.MAKEUPS]: Record<Uuid, Partial<MakeupConstructor>>
  [DOC_TYPES.TAGS]: Record<Uuid, Partial<TagConstructor>>
  [DOC_TYPES.SEMESTERS]: Record<Uuid, Partial<SemesterConstructor>>
  [DOC_TYPES.CLASS_SESSIONS]: Record<Uuid, FirebaseBatchUpdateClassSession>
  // Currently teachers are sent as users
  [DOC_TYPES.TEACHERS]: Record<Uuid, FirebaseBatchUpdateUser>
  [DOC_TYPES.USERS]: Record<Uuid, FirebaseBatchUpdateUser>
}>

export type FirebaseBatchUpdateResponse = Partial<{
  [DOC_TYPES.STUDENTS]: Uuid[]
  [DOC_TYPES.CLASSES]: Uuid[]
  [DOC_TYPES.PROJECTS]: Uuid[]
  [DOC_TYPES.CURRICULUMS]: Uuid[]
  [DOC_TYPES.TRYOUTS]: Uuid[]
  [DOC_TYPES.MAKEUPS]: Uuid[]
  [DOC_TYPES.TAGS]: Uuid[]
  [DOC_TYPES.SEMESTERS]: Uuid[]
  [DOC_TYPES.CLASS_SESSIONS]: Uuid[]
  [DOC_TYPES.TEACHERS]: Uuid[]
}>
