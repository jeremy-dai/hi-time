import { useState, useEffect } from 'react'
import type { QuarterlyGoal } from '../types/time'
import { getQuarterGoals } from '../api'

/**
 * Hook to fetch all quarterly goals for a given year (Q1-Q4)
 * Returns a flat array of all goals for the year
 */
export function useYearQuarterlyGoals(year: number) {
  const [goals, setGoals] = useState<QuarterlyGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadYearGoals = async () => {
      setIsLoading(true)

      try {
        // Fetch all 4 quarters in parallel
        const [q1Data, q2Data, q3Data, q4Data] = await Promise.all([
          getQuarterGoals(year, 1),
          getQuarterGoals(year, 2),
          getQuarterGoals(year, 3),
          getQuarterGoals(year, 4),
        ])

        if (!cancelled) {
          // Combine all goals into a single array
          const allGoals: QuarterlyGoal[] = [
            ...(q1Data?.goals || []),
            ...(q2Data?.goals || []),
            ...(q3Data?.goals || []),
            ...(q4Data?.goals || []),
          ]

          setGoals(allGoals)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to load quarterly goals for year:', year, err)
        if (!cancelled) {
          setGoals([])
          setIsLoading(false)
        }
      }
    }

    loadYearGoals()

    return () => {
      cancelled = true
    }
  }, [year])

  return { goals, isLoading }
}
