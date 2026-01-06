import { useState, useEffect, useCallback, useRef } from 'react'
import type { WeekReview, YearWeekReviews } from '../types/time'
import { getYearWeekReviews, saveWeekReview, deleteWeekReview } from '../api'
import type { SyncStatus } from './useSyncState'

export function useWeekReviews(year: number) {
  const [reviews, setReviews] = useState<Record<number, WeekReview>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  const pendingReviewRef = useRef<WeekReview | null>(null)

  // Load from database on mount, fallback to localStorage
  useEffect(() => {
    isMountedRef.current = true
    let cancelled = false

    const loadReviews = async () => {
      setIsLoading(true)
      const localKey = `week-reviews-${year}`

      // Try loading from database first
      try {
        const dbData = await getYearWeekReviews(year)
        if (!cancelled && dbData) {
          setReviews(dbData.reviews || {})
          // Update localStorage cache
          localStorage.setItem(localKey, JSON.stringify(dbData))
          setSyncStatus('synced')
          setLastSynced(new Date())
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.error('Failed to load week reviews from database:', err)
      }

      // Fallback to localStorage if database fails or returns null
      if (!cancelled) {
        const stored = localStorage.getItem(localKey)
        if (stored) {
          try {
            const parsed: YearWeekReviews = JSON.parse(stored)
            setReviews(parsed.reviews || {})
            // Mark as pending sync since we loaded from localStorage
            setSyncStatus('pending')
          } catch (err) {
            console.error('Failed to parse week reviews from localStorage:', err)
          }
        }
        setIsLoading(false)
      }
    }

    loadReviews()

    return () => {
      cancelled = true
      isMountedRef.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [year])

  // Sync single review to database with debouncing
  const syncReviewToDatabase = useCallback(async (review: WeekReview) => {
    if (!isMountedRef.current) return

    setSyncStatus('syncing')

    try {
      const success = await saveWeekReview(review)

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to sync week review to database:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [])

  // Delete review from database
  const syncDeleteToDatabase = useCallback(async (weekNumber: number) => {
    if (!isMountedRef.current) return

    setSyncStatus('syncing')

    try {
      const success = await deleteWeekReview(year, weekNumber)

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to delete week review from database:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [year])

  const updateReview = useCallback((weekNumber: number, reviewText: string) => {
    const review: WeekReview = {
      year,
      weekNumber,
      review: reviewText,
      createdAt: reviews[weekNumber]?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    const updated = { ...reviews, [weekNumber]: review }
    setReviews(updated)

    // Save to localStorage immediately
    const localKey = `week-reviews-${year}`
    const data: YearWeekReviews = { year, reviews: updated }
    localStorage.setItem(localKey, JSON.stringify(data))

    // Debounce database sync (5 seconds)
    setSyncStatus('pending')
    pendingReviewRef.current = review

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (pendingReviewRef.current) {
        syncReviewToDatabase(pendingReviewRef.current)
        pendingReviewRef.current = null
      }
    }, 5000)
  }, [year, reviews, syncReviewToDatabase])

  const removeReview = useCallback((weekNumber: number) => {
    const { [weekNumber]: _, ...rest } = reviews
    setReviews(rest)

    // Save to localStorage immediately
    const localKey = `week-reviews-${year}`
    const data: YearWeekReviews = { year, reviews: rest }
    localStorage.setItem(localKey, JSON.stringify(data))

    // Clear any pending sync for this review
    if (pendingReviewRef.current?.weekNumber === weekNumber) {
      pendingReviewRef.current = null
    }

    // Cancel pending timeout and sync deletion immediately
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }

    syncDeleteToDatabase(weekNumber)
  }, [year, reviews, syncDeleteToDatabase])

  // Manual sync function
  const syncNow = useCallback(async () => {
    if (syncStatus === 'syncing' || !pendingReviewRef.current) return

    // Clear any pending debounced sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }

    // Sync immediately
    const reviewToSync = pendingReviewRef.current
    pendingReviewRef.current = null
    await syncReviewToDatabase(reviewToSync)
  }, [syncReviewToDatabase, syncStatus])

  // Track if there are unsaved changes
  const hasUnsavedChanges = syncStatus === 'pending'

  return {
    reviews,
    isLoading,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    updateReview,
    removeReview,
    syncNow
  }
}
