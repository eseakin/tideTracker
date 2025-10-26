import capitalize from "lodash/capitalize"
import hasIn from "lodash/hasIn"
import snakeCase from "lodash/snakeCase"

export const stringify = (data: unknown): string =>
  JSON.stringify(data, null, 2)

export const camelToWords = (str?: string): string => {
  return capitalize(snakeCase(str).split("_").join(" "))
}

// Used to grab a field from an array of ids, like names or emails
export const getFormattedField = <T>(data: T[], field: keyof T): string => {
  return data.map((item) => item[field]).join(", ")
}

export type ErrorType = Error | string | { message: string }

export const formatError = (error: ErrorType): string => {
  if (!error) return ""

  if (error instanceof Error || hasIn(error, "message")) {
    return (error as Error).message
  } else if (typeof error === "string") {
    return error
  } else {
    return "Unknown error 🤔"
  }
}

export const formatErrorArray = (errors: ErrorType[]): string => {
  if (!errors || errors.length === 0) return ""

  return errors.map(formatError).join("\n")
}
