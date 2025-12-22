import { useState, useEffect, useMemo } from 'react'
import type { TimeBlock } from './types/time'
import CalendarView from './components/calendar/CalendarView'
import Dashboard from './components/Dashboard'
import { Settings } from './components/Settings'
import Sidebar from './components/Sidebar'
import { formatWeekKey, formatWeekRangeLabel, calculateLastYearWeek } from './utils/date'
import { listWeeks, getWeek, putWeek, exportCSV as apiExportCSV, getSettings, type UserSettings } from './api'
import AppLayout from './components/layout/AppLayout'
import Header from './components/layout/Header'
import { parseTimeCSV } from './utils/csvParser'
import { Login } from './components/Login'
import { useAuth } from './hooks/useAuth'

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'log' | 'dashboard' | 'settings'>('log')
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const currentWeekKey = useMemo(() => formatWeekKey(currentDate), [currentDate])
  const [weekStore, setWeekStore] = useState<Record<string, TimeBlock[][]>>({})
  const [weekData, setWeekData] = useState<TimeBlock[][]>(() => {
    const key = formatWeekKey(new Date())
    const existing = weekStore[key]
    return existing || createEmptyWeekData()
  })
  const [referenceData, setReferenceData] = useState<TimeBlock[][] | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings>({ subcategories: {} })

  useEffect(() => {
    ;(async () => {
      const s = await getSettings()
      if (s) setUserSettings(s)
    })()
  }, [])

  function createEmptyWeekData(): TimeBlock[][] {
    const timeSlots = 32
    const days = 7
    return Array.from({ length: days }, (_, day) =>
      Array.from({ length: timeSlots }, (_, timeIndex) => ({
        id: `${day}-${timeIndex}`,
        time: `${String(8 + Math.floor(timeIndex / 2)).padStart(2, '0')}:${timeIndex % 2 === 0 ? '00' : '30'}`,
        day,
        category: '',
        subcategory: '',
        notes: ''
      }))
    )
  }

  useEffect(() => {
    ;(async () => {
      const keys = await listWeeks()
      const store: Record<string, TimeBlock[][]> = {}
      for (const k of keys) {
        const wd = await getWeek(k)
        if (wd) store[k] = wd
      }
      setWeekStore(store)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      // Load current week data
      const existing = await getWeek(currentWeekKey)
      if (existing) {
        setWeekStore(prev => ({ ...prev, [currentWeekKey]: existing }))
        setWeekData(existing)
      } else {
        const empty = createEmptyWeekData()
        setWeekStore(prev => ({ ...prev, [currentWeekKey]: empty }))
        setWeekData(empty)
        await putWeek(currentWeekKey, empty)
      }

      // Load ghost data (last year's same week)
      const lastYearWeekKey = calculateLastYearWeek(currentWeekKey)
      const ghostData = await getWeek(lastYearWeekKey)
      setReferenceData(ghostData)
    })()
  }, [currentWeekKey])

  useEffect(() => {
    const data = weekStore[currentWeekKey]
    if (data) setWeekData(data)
  }, [weekStore, currentWeekKey])

  const handleUpdateBlock = (day: number, timeIndex: number, block: TimeBlock) => {
    setWeekStore(prev => {
      const current = prev[currentWeekKey] || createEmptyWeekData()
      const newWeek = [...current]
      newWeek[day] = [...newWeek[day]]
      newWeek[day][timeIndex] = block
      // optimistic update
      putWeek(currentWeekKey, newWeek)
      return { ...prev, [currentWeekKey]: newWeek }
    })
  }

  const handleImportCSV = (importedData: TimeBlock[][]) => {
    setWeekStore(prev => ({ ...prev, [currentWeekKey]: importedData }))
    setWeekData(importedData)
    putWeek(currentWeekKey, importedData)
  }
  // keep referenceData state to support future look-back imports
  const handleImportCSVFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const { weekData } = parseTimeCSV(content)
        handleImportCSV(weekData)
      } catch {
        // ignore parsing errors for minimal flow; can surface UI later
      }
    }
    reader.readAsText(file)
  }

  const handleExportCSV = async () => {
    const csvContent = await apiExportCSV(currentWeekKey)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `timesheet_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <AppLayout
      sidebar={<Sidebar active={activeTab} onNavigate={setActiveTab} />}
      header={
        <Header 
          currentDate={currentDate} 
          onChangeDate={(d) => setCurrentDate(d)}
          onImportCSVFile={handleImportCSVFile}
          onExportCSV={() => {
            apiExportCSV(currentWeekKey).then(csv => {
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${currentWeekKey}.csv`
              a.click()
            })
          }}
        />
      }
    >
      <div className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        {formatWeekRangeLabel(currentDate)}
      </div>
      {activeTab === 'log' && (
        <CalendarView
          weekData={weekData}
          onUpdateBlock={handleUpdateBlock}
          referenceData={referenceData}
          weekStartDate={new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1))}
          userSettings={userSettings}
        />
      )}
      {activeTab === 'dashboard' && <Dashboard weekData={weekData} weeksStore={weekStore} />}
      {activeTab === 'settings' && <Settings />}
    </AppLayout>
  )
}

export default App
