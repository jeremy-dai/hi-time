import type { TimeBlock } from '../types/time'

/**
 * TECHNICAL DEBT: CSV parsing logic is duplicated between frontend and backend
 * - Frontend: /time-tracker/src/utils/csvParser.ts (this file)
 * - Backend: /api/src/csv.js
 *
 * Currently, frontend parsing is used for:
 * 1. Reference data imports (ghost blocks feature - client-side only)
 * 2. Regular CSV imports (could use backend /api/weeks/:week_key/import instead)
 *
 * TODO: Consider consolidating to use backend import API for regular imports
 * while keeping minimal frontend parsing for reference/ghost feature.
 */

export interface ParsedCSVData {
  weekData: TimeBlock[][]
  summary: {
    totalBlocks: number
    categoryCounts: Record<string, number>
  }
}

export function parseTimeCSV(csvContent: string): ParsedCSVData {
  const lines = csvContent.split('\n')
  const weekData: TimeBlock[][] = Array.from({ length: 7 }, () => [])
  const categoryCounts: Record<string, number> = {}
  let totalBlocks = 0

  // Find the time data row (starts with "Time")
  let timeRowIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Time,')) {
      timeRowIndex = i
      break
    }
  }

  if (timeRowIndex === -1) {
    throw new Error('Invalid CSV format: Time row not found')
  }

  // Parse time slots
  const timeRow = lines[timeRowIndex].split(',')
  const timeSlots: string[] = []
  
  // Find time slots (columns after the first one)
  for (let i = 1; i < timeRow.length; i++) {
    if (timeRow[i].trim() && !isNaN(Number(timeRow[i]))) {
      // Convert Excel date to time string
      const excelDate = Number(timeRow[i])
      const hours = Math.floor(excelDate * 24)
      const minutes = Math.round((excelDate * 24 - hours) * 60)
      timeSlots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    }
  }

  // Parse data rows
  for (let day = 0; day < 7; day++) {
    const dayRowIndex = timeRowIndex + day + 1
    if (dayRowIndex >= lines.length) break

    const dayRow = lines[dayRowIndex].split(',')
    const dayData: TimeBlock[] = []

    for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
      const cellIndex = timeIndex + 1 // Skip first column (time header)
      const cellData = dayRow[cellIndex]?.trim() || ''
      
      // Parse cell data
      // Format:
      // "R:" -> category only
      // "R:subcategory:" -> category + subcategory
      // "R:subcategory:notes" -> category + subcategory + notes
      // "R:notes" -> category + notes
      let category = ''
      let subcategory = ''
      let notes = ''

      if (cellData) {
        const parts = cellData.split(':')

        if (parts.length >= 1 && parts[0].length === 1 && /[A-Z]/.test(parts[0])) {
          // Starts with category letter
          category = parts[0]

          if (parts.length === 2) {
            // "R:" or "R:notes"
            const rest = parts[1].trim()
            if (rest) {
              notes = rest
            }
          } else if (parts.length === 3) {
            // "R:subcategory:" or "R:subcategory:notes"
            subcategory = parts[1].trim()
            notes = parts[2].trim()
          } else if (parts.length > 3) {
            // "R:subcategory:notes:with:colons"
            subcategory = parts[1].trim()
            notes = parts.slice(2).join(':').trim()
          }
        } else {
          // Old format fallback or just notes
          const match = cellData.match(/^([A-Z]):\s*(.*)$/)
          if (match) {
            category = match[1]
            notes = match[2] || ''
          } else if (cellData.length === 1 && /[A-Z]/.test(cellData)) {
            category = cellData
          } else {
            notes = cellData
          }
        }
      }

      const block: TimeBlock = {
        id: `${day}-${timeIndex}`,
        time: timeSlots[timeIndex] || `${String(8 + Math.floor(timeIndex / 2)).padStart(2, '0')}:${timeIndex % 2 === 0 ? '00' : '30'}`,
        day,
        category: category as import('../types/time').CategoryKey,
        subcategory,
        notes
      }

      dayData.push(block)
      
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
        totalBlocks++
      }
    }

    weekData[day] = dayData
  }

  return {
    weekData,
    summary: {
      totalBlocks,
      categoryCounts
    }
  }
}