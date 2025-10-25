

function convertToCSV(data: Record<string, any>[]): string {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '""'); 
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

export function exportToCSV(data: Record<string, any>[], filename: string): void {
    const csvString = convertToCSV(data);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


export function parseCSV(csvText: string): Record<string, any>[] {
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 2) {
        return []; 
    }

    const normalizeHeader = (h: string) => 
        h.trim()
         .replace(/"/g, '')
         .toLowerCase()
         .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
         .replace(/[^a-z0-9_]/g, '_') 
         .replace(/_{2,}/g, '_'); 


    const headers = lines[0].split(',').map(normalizeHeader);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const entry: Record<string, any> = {};
        
        for (let j = 0; j < headers.length; j++) {
            if (headers[j]) {
                entry[headers[j]] = values[j] || '';
            }
        }
        data.push(entry);
    }
    return data;
}
