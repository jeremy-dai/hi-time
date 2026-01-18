import { useState, useEffect, useCallback, useRef } from 'react'
import type { LearningDocument, LearningDocumentCreateInput, LearningDocumentUpdateInput } from '../types/time'
import {
  getLearningDocuments,
  createLearningDocument,
  updateLearningDocument,
  deleteLearningDocument as apiDeleteLearningDocument
} from '../api'
import type { SyncStatus } from './useSyncState'

export function useLearningDocuments() {
  const [documents, setDocuments] = useState<LearningDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const isMountedRef = useRef(true)

  // Load documents from database
  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    setSyncStatus('syncing')

    try {
      const docs = await getLearningDocuments()
      if (isMountedRef.current) {
        setDocuments(docs)
        setSyncStatus('synced')
        setLastSynced(new Date())
      }
    } catch (err) {
      console.error('Failed to load learning documents:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // Load documents on mount
  useEffect(() => {
    isMountedRef.current = true
    loadDocuments()

    return () => {
      isMountedRef.current = false
    }
  }, [loadDocuments])

  // Create a new document
  const createDocument = useCallback(async (input: LearningDocumentCreateInput): Promise<LearningDocument | null> => {
    setSyncStatus('syncing')

    try {
      const newDoc = await createLearningDocument(input)
      if (newDoc && isMountedRef.current) {
        setDocuments(prev => [...prev, newDoc])
        setSyncStatus('synced')
        setLastSynced(new Date())
        return newDoc
      }
      return null
    } catch (err) {
      console.error('Failed to create learning document:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
      }
      return null
    }
  }, [])

  // Update an existing document
  const updateDocument = useCallback(async (id: string, updates: LearningDocumentUpdateInput): Promise<boolean> => {
    setSyncStatus('syncing')

    // Optimistic update
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          ...updates,
          updatedAt: Date.now()
        }
      }
      return doc
    }))

    try {
      const updatedDoc = await updateLearningDocument(id, updates)
      if (updatedDoc && isMountedRef.current) {
        // Replace with server response
        setDocuments(prev => prev.map(doc => doc.id === id ? updatedDoc : doc))
        setSyncStatus('synced')
        setLastSynced(new Date())
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to update learning document:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
        // Reload to get accurate state
        loadDocuments()
      }
      return false
    }
  }, [loadDocuments])

  // Delete a document
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setSyncStatus('syncing')

    // Optimistic update
    setDocuments(prev => prev.filter(doc => doc.id !== id))

    try {
      const success = await apiDeleteLearningDocument(id)
      if (success && isMountedRef.current) {
        setSyncStatus('synced')
        setLastSynced(new Date())
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to delete learning document:', err)
      if (isMountedRef.current) {
        setSyncStatus('error')
        // Reload to get accurate state
        loadDocuments()
      }
      return false
    }
  }, [loadDocuments])

  // Manual refresh
  const refresh = useCallback(() => {
    loadDocuments()
  }, [loadDocuments])

  return {
    documents,
    isLoading,
    syncStatus,
    lastSynced,
    createDocument,
    updateDocument,
    deleteDocument,
    refresh
  }
}
