import apiClient from '../api/client';

function cleanParams(params = {}) {
    return Object.entries(params).reduce((next, [key, value]) => {
        if (key === 'page' || value === '' || value === null || value === undefined) {
            return next;
        }

        next[key] = value;
        return next;
    }, {});
}

export async function fetchFilteredExportRows(endpoint, params = {}) {
    const rows = [];
    let page = 1;
    let lastPage = 1;

    do {
        const response = await apiClient.get(endpoint, {
            params: {
                ...cleanParams(params),
                page,
                per_page: 50,
            },
        });

        const payload = response.data;
        const pageRows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

        rows.push(...pageRows);

        lastPage = Number(payload?.last_page || 1);
        page += 1;
    } while (page <= lastPage);

    return rows;
}
