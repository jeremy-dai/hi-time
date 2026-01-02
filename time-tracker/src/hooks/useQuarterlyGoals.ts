import { useState, useEffect, useCallback, useRef } from 'react'
import type { QuarterGoals, QuarterlyGoal } from '../types/time'
import {
  getQuarterGoals,
  createQuarterlyGoal,
  updateQuarterlyGoal,
  deleteQuarterlyGoal,
  createGoalMilestone,
  updateGoalMilestone,
  deleteGoalMilestone,
} from '../api'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending' | 'error'

// Helper to determine current quarter from month (1-12)
export function getQuarterFromMonth(month: number): number {
  if (month >= 1 && month <= 3) return 1
  if (month >= 4 && month <= 6) return 2
  if (month >= 7 && month <= 9) return 3
  return 4
}

export function useQuarterlyGoals(year: number, quarter: number) {
  const [goals, setGoals] = useState<QuarterlyGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const isMountedRef = useRef(true)

  // Load from database on mount, fallback to localStorage
  useEffect(() => {
    isMountedRef.current = true
    let cancelled = false

    const loadGoals = async () => {
      setIsLoading(true)
      const localKey = `quarterly-goals-${year}-Q${quarter}`

      // Try loading from database first
      try {
        const dbData = await getQuarterGoals(year, quarter)
        if (!cancelled && dbData) {
          setGoals(dbData.goals || [])
          // Update localStorage cache
          localStorage.setItem(localKey, JSON.stringify(dbData))
          setSyncStatus('synced')
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.error('Failed to load quarterly goals from database:', err)
      }

      // Fallback to localStorage if database fails or returns null
      if (!cancelled) {
        const stored = localStorage.getItem(localKey)
        if (stored) {
          try {
            const parsed: QuarterGoals = JSON.parse(stored)
            setGoals(parsed.goals || [])
            // Mark as pending sync since we loaded from localStorage
            setSyncStatus('pending')
          } catch (err) {
            console.error('Failed to parse quarterly goals from localStorage:', err)
          }
        }
        setIsLoading(false)
      }
    }

    loadGoals()

    return () => {
      cancelled = true
      isMountedRef.current = false
    }
  }, [year, quarter])

  // Save to localStorage helper
  const saveToLocalStorage = useCallback((updatedGoals: QuarterlyGoal[]) => {
    const localKey = `quarterly-goals-${year}-Q${quarter}`
    const data: QuarterGoals = { year, quarter, goals: updatedGoals }
    localStorage.setItem(localKey, JSON.stringify(data))
  }, [year, quarter])

  // Create a new goal
  const addGoal = useCallback(async (title: string, description?: string) => {
    setSyncStatus('syncing')

    try {
      const newGoal = await createQuarterlyGoal(year, quarter, title, description)

      if (!isMountedRef.current) return

      if (newGoal) {
        const updatedGoals = [...goals, newGoal]
        setGoals(updatedGoals)
        saveToLocalStorage(updatedGoals)
        setSyncStatus('synced')
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to create quarterly goal:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [year, quarter, goals, saveToLocalStorage])

  // Update a goal
  const updateGoal = useCallback(
    async (
      goalId: string,
      updates: {
        title?: string
        description?: string
        completed?: boolean
        displayOrder?: number
      }
    ) => {
      setSyncStatus('syncing')

      // Optimistically update UI
      const optimisticGoals = goals.map(g =>
        g.id === goalId ? { ...g, ...updates, updatedAt: Date.now() } : g
      )
      setGoals(optimisticGoals)
      saveToLocalStorage(optimisticGoals)

      try {
        const success = await updateQuarterlyGoal(goalId, updates)

        if (!isMountedRef.current) return

        if (success) {
          setSyncStatus('synced')
        } else {
          // Revert on failure
          setGoals(goals)
          saveToLocalStorage(goals)
          setSyncStatus('error')
        }
      } catch (err) {
        console.error('Failed to update quarterly goal:', err)
        if (isMountedRef.current) {
          setGoals(goals)
          saveToLocalStorage(goals)
          setSyncStatus('error')
        }
      }
    },
    [goals, saveToLocalStorage]
  )

  // Delete a goal
  const removeGoal = useCallback(
    async (goalId: string) => {
      setSyncStatus('syncing')

      // Optimistically remove from UI
      const updatedGoals = goals.filter(g => g.id !== goalId)
      setGoals(updatedGoals)
      saveToLocalStorage(updatedGoals)

      try {
        const success = await deleteQuarterlyGoal(goalId)

        if (!isMountedRef.current) return

        if (success) {
          setSyncStatus('synced')
        } else {
          // Revert on failure
          setGoals(goals)
          saveToLocalStorage(goals)
          setSyncStatus('error')
        }
      } catch (err) {
        console.error('Failed to delete quarterly goal:', err)
        if (isMountedRef.current) {
          setGoals(goals)
          saveToLocalStorage(goals)
          setSyncStatus('error')
        }
      }
    },
    [goals, saveToLocalStorage]
  )

  // Add a milestone to a goal
  const addMilestone = useCallback(
    async (goalId: string, title: string) => {
      setSyncStatus('syncing')

      try {
        const newMilestone = await createGoalMilestone(goalId, title)

        if (!isMountedRef.current) return

        if (newMilestone) {
          const updatedGoals = goals.map(g =>
            g.id === goalId ? { ...g, milestones: [...g.milestones, newMilestone] } : g
          )
          setGoals(updatedGoals)
          saveToLocalStorage(updatedGoals)
          setSyncStatus('synced')
        } else {
          setSyncStatus('error')
        }
      } catch (err) {
        console.error('Failed to create milestone:', err)
        if (isMountedRef.current) {
          setSyncStatus('error')
        }
      }
    },
    [goals, saveToLocalStorage]
  )

  // Update a milestone
  const updateMilestone = useCallback(
    async (
      goalId: string,
      milestoneId: string,
      updates: {
        title?: string
        completed?: boolean
        displayOrder?: number
      }
    ) => {
      setSyncStatus('syncing')

      // Optimistically update UI
      const optimisticGoals = goals.map(g =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map(m =>
                m.id === milestoneId ? { ...m, ...updates, updatedAt: Date.now() } : m
              ),
            }
          : g
      )
      setGoals(optimisticGoals)
      saveToLocalStorage(optimisticGoals)

      try {
        const success = await updateGoalMilestone(milestoneId, updates)

        if (!isMountedRef.current) return

        if (success) {
          setSyncStatus('synced')
        } else {
          // Revert on failure
          setGoals(goals)
          saveToLocalStorage(goals)
          setSyncStatus('error')
        }
      } catch (err) {
        console.error('Failed to update milestone:', err)
        if (isMountedRef.current) {
          setGoals(goals)
          saveToLocalStorage(goals)
          setSyncStatus('error')
        }
      }
    },
    [goals, saveToLocalStorage]
  )

  // Delete a milestone
  const removeMilestone = useCallback(
    async (goalId: string, milestoneId: string) => {
      setSyncStatus('syncing')

      // Optimistically remove from UI
      const updatedGoals = goals.map(g =>
        g.id === goalId
          ? { ...g, milestones: g.milestones.filter(m => m.id !== milestoneId) }
          : g
      )
      setGoals(updatedGoals)
      saveToLocalStorage(updatedGoals)

      try {
        const success = await deleteGoalMilestone(milestoneId)

        if (!isMountedRef.current) return

        if (success) {
          setSyncStatus('synced')
        } else {
          // Revert on failure
          setGoals(goals)
          saveToLocalStorage(goals)
          setSyncStatus('error')
        }
      } catch (err) {
        console.error('Failed to delete milestone:', err)
        if (isMountedRef.current) {
          setGoals(goals)
          saveToLocalStorage(goals)
          setSyncStatus('error')
        }
      }
    },
    [goals, saveToLocalStorage]
  )

  return {
    goals,
    isLoading,
    syncStatus,
    addGoal,
    updateGoal,
    removeGoal,
    addMilestone,
    updateMilestone,
    removeMilestone,
  }
}
