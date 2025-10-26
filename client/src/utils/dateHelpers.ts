import dayjs from "dayjs"

import { Dayjs } from "#customTypes/globalTypes"

import { stringify } from "./textFormatters"
export const STANDARD_DATE_FORMAT = "M/D/YY"
export const STANDARD_TIME_FORMAT = "h:mm a"
export const STANDARD_DATE_TIME_FORMAT = `${STANDARD_DATE_FORMAT} ${STANDARD_TIME_FORMAT}`

export const setDayjsTimeToZero = (date: Dayjs): Dayjs => {
  if (date == null || !dayjs.isDayjs(date) || !date.isValid())
    throw new Error(`setDayjsTimeToZero: Invalid date: ${stringify(date)}`)

  return date.startOf("day")
}

export const setTimeFromString = (
  dateStr: string | undefined | null,
  timeStr: string | undefined | null
): Dayjs | null => {
  if (dateStr == null || timeStr == null || !dayjs(dateStr).isValid())
    return null

  const [time, meridian] = timeStr.split(" ")
  const [hours, minutes] = time.split(":")
  let hour = parseInt(hours)

  // Convert to 24 hour format if PM
  if (meridian.toLowerCase() === "pm" && hour !== 12) hour += 12
  // Convert 12 AM to 0
  if (meridian.toLowerCase() === "am" && hour === 12) hour = 0

  const result = dayjs(dateStr)
    .set("hour", hour)
    .set("minute", parseInt(minutes))

  if (!result.isValid()) return null

  return result
}



