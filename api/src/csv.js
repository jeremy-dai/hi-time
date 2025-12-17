export function parseTimeCSV(csvContent) {
  const lines = csvContent.split('\n');
  const weekData = Array.from({ length: 7 }, () => []);
  const categoryCounts = {};
  let totalBlocks = 0;

  let timeRowIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Time,')) {
      timeRowIndex = i;
      break;
    }
  }
  if (timeRowIndex === -1) {
    throw new Error('Invalid CSV format: Time row not found');
  }

  const timeRow = lines[timeRowIndex].split(',');
  const timeSlots = [];
  for (let i = 1; i < timeRow.length; i++) {
    const token = (timeRow[i] || '').trim();
    if (token && !isNaN(Number(token))) {
      const excelDate = Number(token);
      const hours = Math.floor(excelDate * 24);
      const minutes = Math.round((excelDate * 24 - hours) * 60);
      timeSlots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }

  for (let day = 0; day < 7; day++) {
    const dayRowIndex = timeRowIndex + day + 1;
    if (dayRowIndex >= lines.length) break;

    const dayRow = lines[dayRowIndex].split(',');
    const dayData = [];

    for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
      const cellIndex = timeIndex + 1;
      const cellData = (dayRow[cellIndex] || '').trim();

      let category = '';
      let subcategory = '';
      let notes = '';

      if (cellData) {
        const match = cellData.match(/^([A-Z]):\s*(.*)$/);
        if (match) {
          category = match[1];
          subcategory = match[2] || '';
          notes = match[2] || '';
        } else {
          if (cellData.length === 1 && /[A-Z]/.test(cellData)) {
            category = cellData;
          } else {
            notes = cellData;
          }
        }
      }

      const block = {
        id: `${day}-${timeIndex}`,
        time: timeSlots[timeIndex] || `${String(8 + Math.floor(timeIndex / 2)).padStart(2, '0')}:${timeIndex % 2 === 0 ? '00' : '30'}`,
        day,
        category,
        subcategory,
        notes,
      };

      dayData.push(block);
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        totalBlocks++;
      }
    }

    weekData[day] = dayData;
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
  const timeSlots = (weekData[0] || []).map((block) => block.time);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let csv = 'Time,' + days.join(',') + '\n';

  for (let timeIndex = 0; timeIndex < timeSlots.length; timeIndex++) {
    csv += timeSlots[timeIndex] + ',';

    for (let day = 0; day < 7; day++) {
      const block = (weekData[day] || [])[timeIndex];
      if (block && block.category) {
        csv += `${block.category}:${block.subcategory || ''}`;
      }
      csv += ',';
    }
    csv += '\n';
  }

  return csv;
}
