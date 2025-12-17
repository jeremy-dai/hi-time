const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function startOfISOWeek(date: Date): Date {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfISOWeek(date: Date): Date {
  const start = startOfISOWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export function getISOWeekYear(date: Date): { isoWeek: number; isoYear: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const isoYear = d.getFullYear()
  const jan4 = new Date(isoYear, 0, 4)
  const week = 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
  return { isoWeek: week, isoYear }
}

export function formatWeekKey(date: Date): string {
  const { isoWeek, isoYear } = getISOWeekYear(date)
  const w = String(isoWeek).padStart(2, '0')
  return `${isoYear}-W${w}`
}

export function formatWeekRangeLabel(date: Date): string {
  const start = startOfISOWeek(date)
  const end = endOfISOWeek(date)
  const s = `${monthNames[start.getMonth()]} ${start.getDate()}`
  const e = `${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
  return `${s} - ${e}`
}
