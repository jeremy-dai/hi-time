import { useState } from 'react'
import { Target, ChevronDown, ChevronRight, Plus, CheckCircle2, Circle, X, Edit2, Trash2, Info, ChevronLeft } from 'lucide-react'
import { cn } from '../utils/classNames'
import type { QuarterlyGoal } from '../types/time'
import Tooltip from './shared/Tooltip'

interface QuarterlyGoalsBannerProps {
  year: number
  quarter: number
  goals: QuarterlyGoal[]
  isLoading: boolean
  onYearChange: (year: number) => void
  onQuarterChange: (quarter: number) => void
  onAddGoal: (title: string, description?: string) => void
  onUpdateGoal: (
    goalId: string,
    updates: { title?: string; description?: string; completed?: boolean }
  ) => void
  onRemoveGoal: (goalId: string) => void
  onAddMilestone: (goalId: string, title: string) => void
  onUpdateMilestone: (
    goalId: string,
    milestoneId: string,
    updates: { title?: string; completed?: boolean }
  ) => void
  onRemoveMilestone: (goalId: string, milestoneId: string) => void
}

function getQuarterName(quarter: number): string {
  const ranges = ['', 'Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']
  return ranges[quarter] || ''
}

export default function QuarterlyGoalsBanner({
  year,
  quarter,
  goals,
  isLoading,
  onYearChange,
  onQuarterChange,
  onAddGoal,
  onUpdateGoal,
  onRemoveGoal,
  onAddMilestone,
  onUpdateMilestone,
  onRemoveMilestone,
}: QuarterlyGoalsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDesc, setNewGoalDesc] = useState('')
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [addingMilestoneFor, setAddingMilestoneFor] = useState<string | null>(null)
  const [isAddingGoal, setIsAddingGoal] = useState(false)

  const toggleGoalExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals)
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId)
    } else {
      newExpanded.add(goalId)
    }
    setExpandedGoals(newExpanded)
  }

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      onAddGoal(newGoalTitle.trim(), newGoalDesc.trim() || undefined)
      setNewGoalTitle('')
      setNewGoalDesc('')
      setIsAddingGoal(false)
    }
  }

  const handleAddMilestone = (goalId: string) => {
    if (newMilestoneTitle.trim()) {
      onAddMilestone(goalId, newMilestoneTitle.trim())
      setNewMilestoneTitle('')
      setAddingMilestoneFor(null)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-8 py-3">
        <div className="max-w-5xl mx-auto text-sm text-gray-600">Loading goals...</div>
      </div>
    )
  }

  const quarterName = getQuarterName(quarter)
  const totalGoals = goals.length
  const completedGoals = goals.filter(g => g.completed).length

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3)

  const isCurrentQuarter = year === currentYear && quarter === currentQuarter
  const isFutureQuarter = year > currentYear || (year === currentYear && quarter > currentQuarter)

  const handlePrevQuarter = () => {
    if (quarter === 1) {
      onYearChange(year - 1)
      onQuarterChange(4)
    } else {
      onQuarterChange(quarter - 1)
    }
  }

  const handleNextQuarter = () => {
    if (isFutureQuarter) return

    if (quarter === 4) {
      onYearChange(year + 1)
      onQuarterChange(1)
    } else {
      onQuarterChange(quarter + 1)
    }
  }

  return (
    <div className="bg-emerald-50 border-b border-emerald-200 px-8 py-3">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className={cn("flex items-center justify-between", isExpanded && "mb-3")}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:bg-emerald-100 rounded px-2 py-1 -ml-2 transition-colors"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <Target size={20} className="text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Q{quarter} {year} Goals {quarterName && `(${quarterName})`}
              </h2>
              {totalGoals > 0 && (
                <span className="text-sm text-gray-600">
                  {completedGoals}/{totalGoals} completed
                </span>
              )}
            </button>

            {/* Quarter Navigation */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handlePrevQuarter}
                className="p-1 hover:bg-emerald-100 rounded transition-colors"
                aria-label="Previous quarter"
              >
                <ChevronLeft size={18} className="text-emerald-600" />
              </button>
              <button
                onClick={handleNextQuarter}
                disabled={isFutureQuarter}
                className={cn(
                  "p-1 rounded transition-colors",
                  isFutureQuarter
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-emerald-100"
                )}
                aria-label="Next quarter"
              >
                <ChevronRight size={18} className="text-emerald-600" />
              </button>
            </div>

            <Tooltip content={
              <div className="w-100 text-left whitespace-normal space-y-2 p-2">
                <p className="text-xs font-semibold text-emerald-700 leading-tight">
                  The biggest mistake in life is not setting goals high enough
                </p>
                <p className="text-xs font-medium text-gray-700">缩小目标数量，其他悬置</p>

                <div className="space-y-2 text-xs border-t pt-2 border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-800">Clarity is the key</p>
                    <p className="text-gray-600 mt-0.5 leading-snug">
                      Present tense, positive, personal!
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">有场景：激励人心</p>
                    <p className="text-gray-600">每天早上回顾</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">有抓手：SMART</p>
                    <p className="text-gray-600 leading-snug">
                      Specific + Measurable + Attainable + Relevant + Time-based
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">有仪式感</p>
                    <p className="text-gray-600">认认真真开个季度会议</p>
                  </div>
                </div>
              </div>
            }>
              <div className="p-1 hover:bg-blue-100 rounded transition-colors cursor-help">
                <Info size={16} className="text-blue-600" />
              </div>
            </Tooltip>
          </div>

          {isExpanded && (
            <button
              onClick={() => setIsAddingGoal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <Plus size={16} />
              Add Goal
            </button>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-2">
            {/* Goals List */}
            {goals.map(goal => {
              const isExpanded = expandedGoals.has(goal.id)
              const completedMilestones = goal.milestones.filter(m => m.completed).length
              const totalMilestones = goal.milestones.length

              return (
                <div
                  key={goal.id}
                  className={cn(
                    'rounded-lg border transition-colors',
                    goal.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  )}
                >
                  {/* Goal Header */}
                  <div className="flex items-start gap-2 p-3">
                    <button
                      onClick={() => onUpdateGoal(goal.id, { completed: !goal.completed })}
                      className="flex-shrink-0 mt-0.5 transition-colors"
                    >
                      {goal.completed ? (
                        <CheckCircle2 size={20} className="text-green-600" />
                      ) : (
                        <Circle size={20} className="text-gray-400" />
                      )}
                    </button>

                    <button
                      onClick={() => toggleGoalExpanded(goal.id)}
                      className="flex-1 text-left flex items-center gap-2"
                    >
                      {totalMilestones > 0 && (
                        <span className="flex-shrink-0">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      )}
                      <div className="flex-1">
                        <div
                          className={cn(
                            'font-medium',
                            goal.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          )}
                        >
                          {goal.title}
                        </div>
                        {totalMilestones > 0 && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            {completedMilestones}/{totalMilestones} milestones
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => onRemoveGoal(goal.id)}
                      className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Milestones */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pl-11 space-y-1">
                      {goal.milestones.map(milestone => (
                        <div key={milestone.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() =>
                              onUpdateMilestone(goal.id, milestone.id, {
                                completed: !milestone.completed,
                              })
                            }
                            className="flex-shrink-0"
                          >
                            {milestone.completed ? (
                              <CheckCircle2 size={16} className="text-green-600" />
                            ) : (
                              <Circle size={16} className="text-gray-400" />
                            )}
                          </button>
                          <span
                            className={cn(
                              'flex-1 text-sm',
                              milestone.completed
                                ? 'text-gray-500 line-through'
                                : 'text-gray-700'
                            )}
                          >
                            {milestone.title}
                          </span>
                          <button
                            onClick={() => onRemoveMilestone(goal.id, milestone.id)}
                            className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      {/* Add Milestone */}
                      {addingMilestoneFor === goal.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={newMilestoneTitle}
                            onChange={e => setNewMilestoneTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddMilestone(goal.id)
                              if (e.key === 'Escape') {
                                setAddingMilestoneFor(null)
                                setNewMilestoneTitle('')
                              }
                            }}
                            placeholder="Milestone title"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddMilestone(goal.id)}
                            className="px-2 py-1 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setAddingMilestoneFor(null)
                              setNewMilestoneTitle('')
                            }}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingMilestoneFor(goal.id)}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 mt-2"
                        >
                          <Plus size={14} />
                          Add milestone
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add New Goal Form */}
            {isAddingGoal && (
              <div className="bg-white rounded-xl border border-emerald-300 p-3">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddGoal()
                    }
                    if (e.key === 'Escape') {
                      setIsAddingGoal(false)
                      setNewGoalTitle('')
                      setNewGoalDesc('')
                    }
                  }}
                  placeholder="Goal title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                  autoFocus
                />
                <textarea
                  value={newGoalDesc}
                  onChange={e => setNewGoalDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2 resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddGoal}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700"
                  >
                    Add Goal
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingGoal(false)
                      setNewGoalTitle('')
                      setNewGoalDesc('')
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {goals.length === 0 && !isAddingGoal && (
              <div className="text-center py-6 text-gray-500">
                <Target size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No goals for Q{quarter} {year} yet.</p>
                <p className="text-xs mt-1">Click "Add Goal" to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
