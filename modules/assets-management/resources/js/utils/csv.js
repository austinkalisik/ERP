export function downloadCsv(filename, rows, headers = null) {
    if (!rows || !rows.length) {
        return;
    }

    const resolvedHeaders = headers || Object.keys(rows[0]);

    const escapeValue = (value) => {
        const safe = value === null || value === undefined ? '' : String(value);
        return `"${safe.replace(/"/g, '""')}"`;
    };

    const lines = [
        resolvedHeaders.map(escapeValue).join(','),
        ...rows.map((row) =>
            resolvedHeaders.map((header) => escapeValue(row[header])).join(',')
        ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}