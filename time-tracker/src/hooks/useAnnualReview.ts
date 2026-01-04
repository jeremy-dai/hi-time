import { useState, useEffect, useCallback, useRef } from 'react'
import type { AnnualReview } from '../types/time'
import { getAnnualReview, saveAnnualReview, deleteAnnualReview } from '../api'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending' | 'error'

export function useAnnualReview(year: number) {
  const [review, setReview] = useState<AnnualReview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  const pendingReviewRef = useRef<string | null>(null)

  // Load from database on mount, fallback to localStorage
  useEffect(() => {
    isMountedRef.current = true
    let cancelled = false

    const loadReview = async () => {
      setIsLoading(true)
      const localKey = `annual-review-${year}`

      // Try loading from database first
      let dbSuccess = false
      try {
        const dbData = await getAnnualReview(year)
        dbSuccess = true // Database query succeeded (even if it returned null)

        if (!cancelled) {
          if (dbData) {
            // Database has data - use it and cache in localStorage
            setReview(dbData)
            localStorage.setItem(localKey, JSON.stringify(dbData))
            setSyncStatus('synced')
            setLastSynced(new Date())
          } else {
            // Database successfully returned null - no review exists for this year
            // Clear any stale localStorage data
            setReview(null)
            localStorage.removeItem(localKey)
            setSyncStatus('idle')
          }
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.error('Failed to load annual review from database:', err)
        dbSuccess = false
      }

      // Only use localStorage if database fetch FAILED (network error, etc)
      // Don't use localStorage if database successfully returned null
      if (!cancelled && !dbSuccess) {
        const stored = localStorage.getItem(localKey)
        if (stored) {
          try {
            const parsed: AnnualReview = JSON.parse(stored)
            setReview(parsed)
            // Mark as pending sync since we loaded from localStorage during DB failure
            setSyncStatus('pending')
          } catch (err) {
            console.error('Failed to parse annual review from localStorage:', err)
            setReview(null)
          }
        } else {
          setReview(null)
        }
        setIsLoading(false)
      }
    }

    loadReview()

    return () => {
      cancelled = true
      isMountedRef.current = false

      // Sync on unmount: If there's pending data, sync it immediately before cleanup
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }

      if (pendingReviewRef.current) {
        // Sync immediately on unmount (don't wait for debounce)
        saveAnnualReview(year, pendingReviewRef.current)
        pendingReviewRef.current = null
      }
    }
  }, [year])

  // Sync review to database with debouncing
  const syncReviewToDatabase = useCallback(async (reviewText: string) => {
    if (!isMountedRef.current) return

    setSyncStatus('syncing')

    try {
      const success = await saveAnnualReview(year, reviewText)

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to sync annual review to database:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [year])

  // Delete review from database
  const syncDeleteToDatabase = useCallback(async () => {
    if (!isMountedRef.current) return

    setSyncStatus('syncing')

    try {
      const success = await deleteAnnualReview(year)

      if (!isMountedRef.current) return

      if (success) {
        setSyncStatus('synced')
        setLastSynced(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch (err) {
      console.error('Failed to delete annual review from database:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    }
  }, [year])

  const updateReview = useCallback((reviewText: string) => {
    const updatedReview: AnnualReview = {
      year,
      review: reviewText,
      createdAt: review?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    setReview(updatedReview)

    // Save to localStorage immediately
    const localKey = `annual-review-${year}`
    localStorage.setItem(localKey, JSON.stringify(updatedReview))

    // Debounce database sync (5 seconds) - follows documented pattern
    setSyncStatus('pending')
    pendingReviewRef.current = reviewText

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (pendingReviewRef.current) {
        syncReviewToDatabase(pendingReviewRef.current)
        pendingReviewRef.current = null
      }
    }, 5000)
  }, [year, review, syncReviewToDatabase])

  const removeReview = useCallback(() => {
    setReview(null)

    // Save to localStorage immediately
    const localKey = `annual-review-${year}`
    localStorage.removeItem(localKey)

    // Clear any pending sync for this review
    pendingReviewRef.current = null

    // Cancel pending timeout and sync deletion immediately
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }

    syncDeleteToDatabase()
  }, [year, syncDeleteToDatabase])

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
    review,
    isLoading,
    syncStatus,
    lastSynced,
    hasUnsavedChanges,
    updateReview,
    removeReview,
    syncNow
  }
}
