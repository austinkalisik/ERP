export const statusLabels = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_client: 'Waiting Client',
    resolved: 'Resolved',
    closed: 'Closed',
};

export const priorityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
};

export async function api(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? `Request failed with status ${response.status}.`);
    }

    return response.json();
}
