/**
 * Checks if a value is included in an array with type safety
 * @param arr - The array to check against.
 * @param val - The value to check.
 * @returns True if the value is included in the array.
 */
export const isIncluded = <T extends readonly unknown[]>(
  arr: T,
  val: unknown
): val is T[number] => {
  return (arr as readonly unknown[]).includes(val)
}
