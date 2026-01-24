import { useState, useRef, useMemo, useEffect } from 'react'
import { BookOpen, FileText, Plus, Trash2, Edit, Save, X, Tag, Upload, PanelLeftClose, PanelLeft, Menu } from 'lucide-react'
import { useLearningDocuments } from '../hooks/useLearningDocuments'
import type { LearningDocument } from '../types/time'
import Card from './shared/Card'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { SkeletonLoader } from './shared/SkeletonLoader'
import { Modal } from './shared/Modal'
import { toast } from 'sonner'
import { MarkdownRenderer } from './shared/MarkdownRenderer'

// Document Viewer/Editor Component
function DocumentView({ doc, onUpdate, onDelete }: {
  doc: LearningDocument
  onUpdate: (id: string, updates: { title?: string; content?: string; description?: string | null; tags?: string[] }) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(doc.title)
  const [editContent, setEditContent] = useState(doc.content)
  const [editDescription, setEditDescription] = useState(doc.description || '')
  const [editTags, setEditTags] = useState((doc.tags || []).join(', '))
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdate = async () => {
    const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean)
    const success = await onUpdate(doc.id, {
      title: editTitle,
      content: editContent,
      description: editDescription || null,
      tags: tagsArray
    })

    if (success) {
      setIsEditing(false)
      toast.success('Document saved successfully')
    } else {
      toast.error('Failed to save document')
    }
  }

  const handleDelete = async () => {
    const success = await onDelete(doc.id)
    if (success) {
      toast.success('Document deleted')
    } else {
      toast.error('Failed to delete document')
    }
    setIsDeleting(false)
  }

  return (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-b-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 border-b-2 border-emerald-500 focus:outline-none pb-1"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900">{doc.title}</h2>
          )}
          {!isEditing && doc.description && (
            <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {isEditing ? (
            <>
              <button
                onClick={handleUpdate}
                className="rounded-xl px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditTitle(doc.title)
                  setEditContent(doc.content)
                  setEditDescription(doc.description || '')
                  setEditTags((doc.tags || []).join(', '))
                }}
                className="rounded-xl px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-xl px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => setIsDeleting(true)}
                className="rounded-xl px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      {isEditing ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="learning, programming, notes"
            className="w-full rounded-xl px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      ) : (
        doc.tags && doc.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Tag size={14} className="text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {doc.tags.map((tag, idx) => (
                <span key={idx} className="rounded-full px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )
      )}

      {/* Description (edit mode only) */}
      {isEditing && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Short description or summary"
            className="w-full rounded-xl px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={15}
          className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm resize-y"
          placeholder="# Your Markdown Here&#10;&#10;Write your notes in **markdown** format.&#10;&#10;- Lists work&#10;- Code blocks too&#10;&#10;```javascript&#10;const example = 'hello'&#10;```"
        />
      ) : (
        <div className="bg-gray-50 rounded-xl p-6">
          <MarkdownRenderer content={doc.content} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Delete Document"
        description={`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`}
        variant="danger"
        actions={
          <>
            <button
              onClick={() => setIsDeleting(false)}
              className="rounded-xl px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded-xl px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              Delete
            </button>
          </>
        }
      />
    </div>
  )
}

export function Learning() {
  const {
    documents,
    isLoading,
    syncStatus,
    lastSynced,
    createDocument,
    updateDocument,
    deleteDocument
  } = useLearningDocuments()

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTags, setNewTags] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Derive selected document
  const selectedDoc = useMemo(() =>
    documents.find(d => d.id === selectedDocId) || null,
    [documents, selectedDocId]
  )

  // Auto-select first doc when documents load
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id)
    }
  }, [documents, selectedDocId])

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.warning('Please enter a title')
      return
    }

    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean)
    const doc = await createDocument({
      title: newTitle,
      content: newContent,
      description: newDescription || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined
    })

    if (doc) {
      toast.success('Document created successfully')
      setIsCreating(false)
      setNewTitle('')
      setNewContent('')
      setNewDescription('')
      setNewTags('')
      setSelectedDocId(doc.id)
    } else {
      toast.error('Failed to create document')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Convert FileList to Array
    const fileArray = Array.from(files)

    // Check if all files are markdown
    const nonMarkdownFiles = fileArray.filter(
      f => !f.name.endsWith('.md') && !f.name.endsWith('.markdown')
    )
    if (nonMarkdownFiles.length > 0) {
      toast.warning(`Please upload only .md or .markdown files. Skipped: ${nonMarkdownFiles.map(f => f.name).join(', ')}`)
    }

    const markdownFiles = fileArray.filter(
      f => f.name.endsWith('.md') || f.name.endsWith('.markdown')
    )

    if (markdownFiles.length === 0) {
      e.target.value = ''
      return
    }

    // Single file - open in create form
    if (markdownFiles.length === 1) {
      const file = markdownFiles[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const fileName = file.name.replace(/\.(md|markdown)$/i, '')
        setNewTitle(fileName)
        setNewContent(content)
        setIsCreating(true)
        toast.success(`Loaded "${fileName}"`)
      }
      reader.onerror = () => {
        toast.error('Failed to read file')
      }
      reader.readAsText(file)
    }
    // Multiple files - create all directly
    else {
      toast.info(`Uploading ${markdownFiles.length} documents...`)

      let successCount = 0
      let failCount = 0

      for (const file of markdownFiles) {
        try {
          const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => resolve(event.target?.result as string)
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
          })

          const fileName = file.name.replace(/\.(md|markdown)$/i, '')
          const doc = await createDocument({
            title: fileName,
            content,
            tags: ['imported']
          })

          if (doc) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} document${successCount > 1 ? 's' : ''}`)
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} document${failCount > 1 ? 's' : ''}`)
      }
    }

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  // Handle document deletion - select another doc if current is deleted
  const handleDeleteDoc = async (id: string) => {
    const success = await deleteDocument(id)
    if (success && selectedDocId === id) {
      const remaining = documents.filter(d => d.id !== id)
      setSelectedDocId(remaining.length > 0 ? remaining[0].id : null)
    }
    return success
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header with actions */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="flex-1 rounded-xl px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={16} />
            New
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            title="Upload markdown files"
          >
            <Upload size={16} />
          </button>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No documents yet
          </div>
        ) : (
          <div className="py-2">
            {documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDocId(doc.id)
                  setMobileSidebarOpen(false)
                }}
                className={`w-full text-left px-3 py-3 border-b border-gray-100 transition-colors ${
                  selectedDocId === doc.id
                    ? 'bg-emerald-50 border-l-2 border-l-emerald-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <p className={`font-medium text-sm line-clamp-1 ${
                  selectedDocId === doc.id ? 'text-emerald-900' : 'text-gray-900'
                }`}>
                  {doc.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {formatDate(doc.updatedAt)}
                  </span>
                  {doc.tags && doc.tags.length > 0 && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {doc.tags[0]}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="h-full flex bg-linear-to-br from-gray-50 to-gray-100/50">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Documents</h2>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-12' : 'w-72'
      }`}>
        {/* Collapse toggle */}
        <div className="p-2 border-b border-gray-200 flex justify-end">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {!sidebarCollapsed && sidebarContent}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 pb-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <Menu size={20} />
              </button>
              <BookOpen className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">Learning</h1>
            </div>
            <SyncStatusIndicator
              status={syncStatus}
              lastSynced={lastSynced}
              hasUnsavedChanges={false}
              compact={true}
            />
          </div>

          {/* Create New Document Form */}
          {isCreating && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <Plus size={20} className="text-emerald-600" />
                Create New Document
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Document title"
                    className="w-full rounded-xl px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Short description or summary"
                    className="w-full rounded-xl px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="learning, programming, notes"
                    className="w-full rounded-xl px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content (Markdown)</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={12}
                    className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm resize-y"
                    placeholder="# Your Markdown Here&#10;&#10;Write your notes in **markdown** format."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreate}
                    className="flex-1 rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors"
                  >
                    Create Document
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setNewTitle('')
                      setNewContent('')
                      setNewDescription('')
                      setNewTags('')
                    }}
                    className="rounded-xl px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Document Content */}
          {isLoading ? (
            <Card>
              <SkeletonLoader variant="card" height="400px" />
            </Card>
          ) : documents.length === 0 && !isCreating ? (
            <Card>
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No learning documents yet</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors"
                >
                  Create Your First Document
                </button>
              </div>
            </Card>
          ) : selectedDoc && !isCreating ? (
            <Card>
              <DocumentView
                doc={selectedDoc}
                onUpdate={updateDocument}
                onDelete={handleDeleteDoc}
              />
            </Card>
          ) : !isCreating ? (
            <Card>
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a document from the sidebar</p>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
