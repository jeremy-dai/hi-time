import { useState, useRef, useMemo } from 'react'
import { BookOpen, FileText, Settings as SettingsIcon, Plus, Trash2, Edit, Save, X, Tag, Upload } from 'lucide-react'
import { useLearningDocuments } from '../hooks/useLearningDocuments'
import type { LearningDocument } from '../types/time'
import Card from './shared/Card'
import { Tabs } from './shared/Tabs'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { SkeletonLoader } from './shared/SkeletonLoader'
import { Modal } from './shared/Modal'
import { toast } from 'sonner'
import { MarkdownRenderer } from './shared/MarkdownRenderer'

const TABS = [
  {
    id: 'documents',
    label: 'Documents',
    icon: <FileText size={16} />
  },
  {
    id: 'manage',
    label: 'Manage',
    icon: <SettingsIcon size={16} />
  }
]

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
  const [activeTab, setActiveTab] = useState('documents')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all')
  const {
    documents,
    isLoading,
    syncStatus,
    lastSynced,
    createDocument,
    updateDocument,
    deleteDocument
  } = useLearningDocuments()

  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTags, setNewTags] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Extract unique tags and create filter options
  const { tagOptions, filteredDocuments } = useMemo(() => {
    // Get all unique tags with counts
    const tagCounts = new Map<string, number>()
    documents.forEach(doc => {
      doc.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    // Create options array
    const options = [
      { value: 'all', label: `All Documents (${documents.length})` },
      ...Array.from(tagCounts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tag, count]) => ({
          value: tag,
          label: `${tag} (${count})`
        }))
    ]

    // Filter documents based on selected tag
    const filtered = selectedTagFilter === 'all'
      ? documents
      : documents.filter(doc => doc.tags?.includes(selectedTagFilter))

    return { tagOptions: options, filteredDocuments: filtered }
  }, [documents, selectedTagFilter])

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
      setActiveTab('documents')
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
        setActiveTab('documents')
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} document${failCount > 1 ? 's' : ''}`)
      }
    }

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  return (
    <div className="h-full flex bg-linear-to-br from-gray-50 to-gray-100/50">
      {/* Left Sidebar - Tags Navigation */}
      {activeTab === 'documents' && tagOptions.length > 1 && (
        <div className="hidden md:flex w-32 flex-shrink-0 bg-white border-r border-gray-200 p-4 flex-col gap-2 sticky top-0 h-screen overflow-y-auto">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Tags
          </div>

          {tagOptions.map((option) => {
            const isActive = selectedTagFilter === option.value
            const isAll = option.value === 'all'
            const count = option.label.match(/\((\d+)\)/)?.[1] || '0'

            return (
              <button
                key={option.value}
                onClick={() => setSelectedTagFilter(option.value)}
                className={`relative p-3 rounded-xl transition-all flex flex-col items-center gap-2 ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                }`}
              >
                <div className="relative">
                  {isAll ? (
                    <FileText className="w-7 h-7" strokeWidth={2.5} />
                  ) : (
                    <Tag className="w-7 h-7" strokeWidth={2.5} />
                  )}
                  {/* Count badge for individual tags */}
                  {!isAll && (
                    <div className={`absolute -right-2 -top-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      isActive ? "bg-white text-gray-900" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {count}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium text-center leading-tight line-clamp-2 ${
                  isActive ? "text-white" : "text-gray-700"
                }`}>
                  {option.value === 'all' ? 'All' : option.value}
                </span>
                {/* Show count for "All" below the label */}
                {isAll && (
                  <span className={`text-xs ${
                    isActive ? "text-emerald-100" : "text-gray-400"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 pb-12">
          <Card>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
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

            {/* Tabs */}
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-6">
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              {/* Mobile Tag Filter */}
              {tagOptions.length > 1 && (
                <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 -mx-2 px-2 scrollbar-hide">
                  {tagOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedTagFilter(option.value)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedTagFilter === option.value
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {isLoading ? (
                <SkeletonLoader variant="card" height="400px" />
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No learning documents yet</p>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors"
                  >
                    Create Your First Document
                  </button>
                </div>
              ) : (
                <>
                  {/* Filtered Documents */}
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No documents with tag "{selectedTagFilter}"</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredDocuments.map(doc => (
                        <DocumentView
                          key={doc.id}
                          doc={doc}
                          onUpdate={updateDocument}
                          onDelete={deleteDocument}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Create New Document */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <Plus size={20} className="text-emerald-600" />
                  Create New Document
                </h3>

                {!isCreating ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsCreating(true)}
                      className="w-full rounded-xl px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-colors border-2 border-dashed border-emerald-300"
                    >
                      + New Learning Document
                    </button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>
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
                      className="w-full rounded-xl px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors border border-gray-200 flex items-center justify-center gap-2"
                    >
                      <Upload size={16} />
                      Upload Markdown Files (.md)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Document title"
                        className="w-full rounded-xl px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
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
                )}
              </div>

              {/* Document List */}
              {documents.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Documents ({documents.length})</h3>
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{doc.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setActiveTab('documents')}
                          className="rounded-xl px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium transition-colors"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
