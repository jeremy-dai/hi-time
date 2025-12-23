export function parseTimeCSV(csvContent) {
  // Robust line splitting handling different line endings
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  const weekData = Array.from({ length: 7 }, () => []);
  const categoryCounts = {};
  let totalBlocks = 0;

  // 1. Find the "Time" row
  let timeRowIndex = -1;
  let headerRow = [];
  
  for (let i = 0; i < lines.length; i++) {
    const tokens = parseCSVLine(lines[i]);
    if (tokens[0] && tokens[0].trim() === 'Time') {
      timeRowIndex = i;
      headerRow = tokens;
      break;
    }
  }

  if (timeRowIndex === -1) {
    throw new Error('Invalid CSV format: Time row not found');
  }

  // 2. Map Columns to Days (Mon=0, ..., Sun=6)
  // We expect columns 1..7 to contain dates.
  const colToDayIndex = {}; // colIndex -> 0..6
  
  for (let c = 1; c < headerRow.length; c++) {
    const dateStr = headerRow[c].trim();
    if (!dateStr) continue;

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
       // date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
       // App expects: 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun
       const jsDay = date.getDay();
       const appDay = (jsDay + 6) % 7;
       colToDayIndex[c] = appDay;
    }
  }

  // 3. Parse Time Rows
  for (let i = timeRowIndex + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const timeLabel = row[0] ? row[0].trim() : '';

    // Validate time format (e.g. "08:00")
    if (!/^\d{1,2}:\d{2}$/.test(timeLabel)) continue;

    // For each day (0..6), find the corresponding column and parse it
    for (let day = 0; day < 7; day++) {
        // Find which column corresponds to this 'day'
        // We look for key in colToDayIndex where value === day
        const colIndexStr = Object.keys(colToDayIndex).find(key => colToDayIndex[key] === day);
        
        let category = '';
        let subcategory = '';
        let notes = '';
        
        if (colIndexStr) {
            const colIndex = parseInt(colIndexStr, 10);
            if (row[colIndex]) {
                const cellData = row[colIndex].trim();
                
                if (cellData) {
                    // Parse "C: Notes" format
                    const match = cellData.match(/^([A-Z]):\s*(.*)$/);
                    if (match) {
                        category = match[1];
                        // Subcategory not used per user request
                        notes = match[2] || '';
                    } else if (cellData.length === 1 && /[A-Z]/.test(cellData)) {
                        // Just Category Letter
                        category = cellData;
                    } else {
                        // Just Notes
                        notes = cellData;
                    }
                }
            }
        }

        const block = {
            id: `${day}-${weekData[day].length}`,
            time: timeLabel,
            day,
            category,
            subcategory,
            notes,
        };

        weekData[day].push(block);
        
        if (category) {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            totalBlocks++;
        }
    }
  }

  return {
    weekData,
    summary: {
      totalBlocks,
      categoryCounts,
    },
  };
}

export function exportTimeCSV(weekData) {
  // This export function attempts to replicate the NEW transposed format.
  // Header: Time, DateSun, DateMon... (We might not have dates in weekData, just Sun/Mon)
  // So we stick to Sun, Mon headers.
  
  const timeSlots = (weekData[0] || []).map((block) => block.time);
  // Change to Sun..Sat to match UI preference
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Map Sun..Sat to DB indices (6, 0, 1, 2, 3, 4, 5)
  // DB stores [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const dayIndices = [6, 0, 1, 2, 3, 4, 5];

  // Note: We don't have the specific dates in weekData, so we just use Day Names in header.
  // If strict date preservation is needed, we'd need to store dates in weekData.
  let csv = 'Time,' + days.join(',') + '\n';

  for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
    csv += timeSlots[timeIndex] + ',';

    for (let i = 0; i < 7; i++) {
      const day = dayIndices[i];
      const block = (weekData[day] || [])[timeIndex];
      let cell = '';
      if (block) {
        if (block.category) {
            cell = `${block.category}: ${block.notes || ''}`;
            // If notes are empty, maybe just "C:" or "C"? 
            // Previous parser handled "C" or "C: Note".
            if (!block.notes) cell = block.category;
        } else if (block.notes) {
            cell = block.notes;
        }
      }
      
      // Escape commas if needed
      if (cell.includes(',')) {
          cell = `"${cell}"`;
      }
      
      csv += cell + ',';
    }
    // Remove trailing comma? standard CSV usually keeps it if there's a column for it, 
    // but here we have 7 fixed columns.
    // The loop adds a comma after each day.
    // 08:00, SunData, MonData, ..., SatData, 
    // We can trim the last comma if we want clean output, but usually CSV allows trailing empty col or requires exact col count.
    // Let's remove the very last comma of the line.
    csv = csv.slice(0, -1);
    csv += '\n';
  }

  return csv;
}

// Helper: Basic CSV Line Parser handling quotes
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result;
}
