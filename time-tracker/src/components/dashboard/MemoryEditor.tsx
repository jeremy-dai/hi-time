import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { DailyMemory } from '../../types/time'
import { cn } from '../../utils/classNames'

interface MemoryEditorProps {
  date: string
  memory?: DailyMemory
  onSave: (memory: DailyMemory) => void
  onDelete?: () => void
  onClose: () => void
}

const MOOD_OPTIONS = [
  { value: 'terrible' as const, emoji: '😫', label: 'Terrible' },
  { value: 'bad' as const, emoji: '😞', label: 'Bad' },
  { value: 'neutral' as const, emoji: '😐', label: 'Neutral' },
  { value: 'good' as const, emoji: '🙂', label: 'Good' },
  { value: 'great' as const, emoji: '😄', label: 'Great' }
]

export default function MemoryEditor({ date, memory, onSave, onDelete, onClose }: MemoryEditorProps) {
  const [memoryText, setMemoryText] = useState(memory?.memory || '')
  const [mood, setMood] = useState<DailyMemory['mood']>(memory?.mood)
  const [tags, setTags] = useState(memory?.tags?.join(', ') || '')

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSave = () => {
    const newMemory: DailyMemory = {
      date,
      memory: memoryText.trim(),
      mood,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      createdAt: memory?.createdAt || Date.now(),
      updatedAt: Date.now()
    }
    onSave(newMemory)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this memory?')) {
      onDelete?.()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'pointer-events-none'
      )}>
        <div className={cn(
          'bg-white rounded-lg shadow-lg w-full max-w-2xl',
          'pointer-events-auto overflow-hidden'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {memory ? 'Edit Memory' : 'Add Memory'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg',
                'hover:bg-gray-100 transition-colors',
                'text-gray-500 hover:text-gray-700'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Memory Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memory
              </label>
              <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder="What happened on this day?"
                rows={6}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'text-gray-900 placeholder-gray-400'
                )}
              />
            </div>

            {/* Mood Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood (Optional)
              </label>
              <div className="flex gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMood(mood === option.value ? undefined : option.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 px-4 py-3 rounded-lg border-2 transition-all',
                      mood === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                    title={option.label}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-xs text-gray-600">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="work, travel, family (comma separated)"
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'text-gray-900 placeholder-gray-400'
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div>
              {memory && onDelete && (
                <button
                  onClick={handleDelete}
                  className={cn(
                    'px-4 py-2 rounded-lg',
                    'text-red-600 hover:bg-red-50',
                    'transition-colors font-medium'
                  )}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className={cn(
                  'px-4 py-2 rounded-lg',
                  'bg-gray-100 hover:bg-gray-200 text-gray-700',
                  'transition-colors font-medium'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!memoryText.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'transition-colors font-medium',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
