import { type ReactNode } from "react"

import SkeletonBlock from "#blocks/SkeletonBlock"

const WithLoading = ({
  queryResults,
  children,
}: {
  queryResults: Array<{
    isLoading: boolean
    isActive: boolean
  }>
  children: ReactNode
}) => {
  const isReady = queryResults.every(
    ({ isLoading, isActive }) => isActive && !isLoading
  )

  if (!isReady) {
    return <SkeletonBlock count={queryResults.length} />
  }

  return children
}

export default WithLoading
