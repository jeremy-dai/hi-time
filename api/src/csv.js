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
                    // Parse new format:
                    // "R:" -> category only
                    // "R:subcategory:" -> category + subcategory
                    // "R:subcategory:notes" -> category + subcategory + notes
                    // "R:notes" -> category + notes (no subcategory, but has colon)

                    const parts = cellData.split(':');

                    if (parts.length >= 1 && parts[0].length === 1 && /[A-Z]/.test(parts[0])) {
                        // Starts with category letter
                        category = parts[0];

                        if (parts.length === 2) {
                            // "R:" or "R:notes"
                            const rest = parts[1].trim();
                            if (rest) {
                                // Could be subcategory or notes
                                // Heuristic: if it's a single word without spaces, likely subcategory
                                // Otherwise, it's notes
                                // Actually, let's be more specific:
                                // If there's a third part, parts[1] is subcategory
                                // If there's no third part but parts[1] exists, it's notes
                                notes = rest;
                            }
                        } else if (parts.length === 3) {
                            // "R:subcategory:" or "R:subcategory:notes"
                            subcategory = parts[1].trim();
                            notes = parts[2].trim();
                        } else if (parts.length > 3) {
                            // "R:subcategory:notes:with:colons"
                            subcategory = parts[1].trim();
                            notes = parts.slice(2).join(':').trim();
                        }
                    } else {
                        // Old format or just notes without category
                        const match = cellData.match(/^([A-Z]):\s*(.*)$/);
                        if (match) {
                            category = match[1];
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
  // Export format:
  // - "R:" for category only
  // - "R:subcategory:" for category with subcategory
  // - "R:subcategory:notes" for category with subcategory and notes
  // - "R:notes" for category with notes but no subcategory

  const timeSlots = (weekData[0] || []).map((block) => block.time);
  // Change to Sun..Sat to match UI preference
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Map Sun..Sat to DB indices (6, 0, 1, 2, 3, 4, 5)
  // DB stores [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const dayIndices = [6, 0, 1, 2, 3, 4, 5];

  let csv = 'Time,' + days.join(',') + '\n';

  for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
    csv += timeSlots[timeIndex] + ',';

    for (let i = 0; i < 7; i++) {
      const day = dayIndices[i];
      const block = (weekData[day] || [])[timeIndex];
      let cell = '';

      if (block && block.category) {
        // Start with category
        cell = block.category + ':';

        // Add subcategory if present
        if (block.subcategory) {
          cell += block.subcategory + ':';
        }

        // Add notes if present
        if (block.notes) {
          cell += block.notes;
        }
      }

      // Escape commas if needed
      if (cell.includes(',')) {
        cell = `"${cell}"`;
      }

      csv += cell + ',';
    }

    // Remove trailing comma
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
