import { useState, useRef, useMemo, useEffect } from 'react'
import { BookOpen, FileText, Plus, Trash2, Edit, Save, X, Tag, Upload, Search } from 'lucide-react'
import { useLearningDocuments } from '../hooks/useLearningDocuments'
import type { LearningDocument } from '../types/time'
import { SkeletonLoader } from './shared/SkeletonLoader'
import { Modal } from './shared/Modal'
import { toast } from 'sonner'
import { MarkdownRenderer } from './shared/MarkdownRenderer'
import { PageContainer } from './layout/PageContainer'
import { PageHeader } from './layout/PageHeader'

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
    <div className="pb-6 md:pb-8 mb-6 md:mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4 md:mb-6">
        <div className="flex-1 w-full sm:w-auto">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-xl md:text-2xl font-bold text-gray-900 border-b-2 border-emerald-500 focus:outline-none pb-2"
            />
          ) : (
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">{doc.title}</h2>
          )}
          {!isEditing && doc.description && (
            <p className="text-sm md:text-base text-gray-500 mt-2 leading-relaxed">{doc.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4">
          {isEditing ? (
            <>
              <button
                onClick={handleUpdate}
                className="flex-1 sm:flex-none rounded-xl px-4 py-2.5 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px] md:min-h-0"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditTitle(doc.title)
                  setEditContent(doc.content)
                  setEditDescription(doc.description || '')
                  setEditTags((doc.tags || []).join(', '))
                }}
                className="flex-1 sm:flex-none rounded-xl px-4 py-2.5 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px] md:min-h-0"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-none rounded-xl px-4 py-2.5 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px] md:min-h-0"
              >
                <Edit size={16} />
                <span className="sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setIsDeleting(true)}
                className="rounded-xl px-3 py-2.5 md:py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px] md:min-h-0"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      {isEditing ? (
        <div className="mb-4 md:mb-6">
          <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="learning, programming, notes"
            className="w-full rounded-xl px-4 py-3 md:py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base min-h-[44px] md:min-h-0"
          />
        </div>
      ) : (
        doc.tags && doc.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Tag size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex flex-wrap gap-2">
              {doc.tags.map((tag, idx) => (
                <span key={idx} className="rounded-full px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs md:text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )
      )}

      {/* Description (edit mode only) */}
      {isEditing && (
        <div className="mb-4 md:mb-6">
          <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Short description or summary"
            className="w-full rounded-xl px-4 py-3 md:py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base min-h-[44px] md:min-h-0"
          />
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={15}
          className="w-full rounded-xl px-4 py-3 md:py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm md:text-base resize-y leading-relaxed"
          placeholder="# Your Markdown Here&#10;&#10;Write your notes in **markdown** format.&#10;&#10;- Lists work&#10;- Code blocks too&#10;&#10;```javascript&#10;const example = 'hello'&#10;```"
        />
      ) : (
        <div className="bg-gray-50/50 rounded-xl p-4 md:p-6">
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
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTags, setNewTags] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents
    const query = searchQuery.toLowerCase()
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }, [documents, searchQuery])

  // Derive selected document
  const selectedDoc = useMemo(() =>
    documents.find(d => d.id === selectedDocId) || null,
    [documents, selectedDocId]
  )

  // Auto-select first doc when documents load
  useEffect(() => {
    if (filteredDocuments.length > 0 && !selectedDocId) {
      setSelectedDocId(filteredDocuments[0].id)
    }
  }, [documents, selectedDocId, filteredDocuments])

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
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar - Pro Feature */}
      <div className="p-3 pb-0 md:pr-12">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-medium text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          <div className="absolute left-2.5 top-1.5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
            <Search size={14} />
          </div>
        </div>
      </div>

      {/* Header with actions */}
      <div className="px-3 py-3 border-b border-gray-100 flex items-center justify-between mt-1">
        <div className="text-2xs font-bold uppercase tracking-wider text-zinc-400">Documents</div>
        <div className="flex items-center gap-2">
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
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            title="Upload markdown files"
          >
            <Upload size={14} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-lg px-2.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={14} />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {documents.length === 0 ? 'No documents yet' : 'No matching documents'}
          </div>
        ) : (
          <div className="py-0">
            {filteredDocuments.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`w-full text-left px-3 py-3 border-b border-zinc-50 transition-all group relative ${
                  selectedDocId === doc.id
                    ? 'bg-emerald-50/30'
                    : 'hover:bg-zinc-50'
                }`}
              >
                {/* Active Indicator */}
                {selectedDocId === doc.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500" />
                )}

                <p className={`font-semibold text-sm line-clamp-1 mb-1 transition-colors ${
                  selectedDocId === doc.id ? 'text-emerald-900' : 'text-zinc-700 group-hover:text-zinc-900'
                }`}>
                  {doc.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-zinc-400 font-medium group-hover:text-zinc-500 transition-colors">
                    Edited {formatDate(doc.updatedAt)}
                  </span>
                  {doc.tags && doc.tags.length > 0 && (
                    <span className="text-2xs text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-full border border-zinc-200">
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
    <PageContainer
      sidebar={sidebarContent}
      sidebarWidth="wide"
      sidebarCollapsible={true}
      sidebarDefaultCollapsed={false}
      header={
        <PageHeader
          title="Learning"
          icon={BookOpen}
          useGradientTitle={true}
          animateIcon={true}
          sync={{
            status: syncStatus,
            lastSynced,
            hasUnsavedChanges: false
          }}
        />
      }
    >

          {/* Create New Document Form */}
          {isCreating && (
            <div className="mb-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-gray-900 flex items-center gap-2">
                <Plus size={20} className="text-emerald-600" />
                Create New Document
              </h3>
              <div className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Document title"
                    className="w-full rounded-xl px-4 py-3 md:py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base min-h-[44px] md:min-h-0"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Short description or summary"
                    className="w-full rounded-xl px-4 py-3 md:py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base min-h-[44px] md:min-h-0"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="learning, programming, notes"
                    className="w-full rounded-xl px-4 py-3 md:py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base min-h-[44px] md:min-h-0"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Content (Markdown)</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={12}
                    className="w-full rounded-xl px-4 py-3 md:py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm md:text-base resize-y leading-relaxed"
                    placeholder="# Your Markdown Here&#10;&#10;Write your notes in **markdown** format."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleCreate}
                    className="flex-1 rounded-xl px-4 py-3 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm md:text-base shadow-sm transition-colors min-h-[44px] md:min-h-0"
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
                    className="rounded-xl px-4 py-3 md:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm md:text-base transition-colors min-h-[44px] md:min-h-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Content */}
          {isLoading ? (
            <SkeletonLoader variant="card" height="400px" />
          ) : filteredDocuments.length === 0 && !isCreating ? (
            <div className="text-center py-16 md:py-20">
              <FileText className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4 md:mb-6" />
              <p className="text-base md:text-lg text-gray-500 mb-6 md:mb-8">
                {documents.length === 0 ? 'No learning documents yet' : 'No matching documents'}
              </p>
              {documents.length === 0 && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="rounded-xl px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm md:text-base shadow-sm transition-colors min-h-[44px]"
                >
                  Create Your First Document
                </button>
              )}
            </div>
          ) : selectedDoc && !isCreating ? (
            <DocumentView
              key={selectedDoc.id}
              doc={selectedDoc}
              onUpdate={updateDocument}
              onDelete={handleDeleteDoc}
            />
          ) : !isCreating ? (
            <div className="text-center py-16 md:py-20">
              <FileText className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4 md:mb-6" />
              <p className="text-base md:text-lg text-gray-500">Select a document from the sidebar</p>
            </div>
          ) : null}
    </PageContainer>
  )
}
