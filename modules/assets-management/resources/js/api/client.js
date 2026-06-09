import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
});

const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

if (csrfToken) {
    apiClient.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

function updateCsrfToken(token) {
    if (!token) {
        return;
    }

    apiClient.defaults.headers.common['X-CSRF-TOKEN'] = token;

    const meta = document.querySelector('meta[name="csrf-token"]');

    if (meta) {
        meta.setAttribute('content', token);
    }
}

async function refreshCsrfToken() {
    const response = await apiClient.get('/csrf-token', {
        headers: {
            'X-CSRF-REFRESH': '1',
        },
    });

    updateCsrfToken(response.data?.token);

    return response.data?.token;
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error?.response?.status === 419 &&
            originalRequest &&
            !originalRequest.__csrfRetry &&
            !originalRequest.url?.includes('/csrf-token')
        ) {
            originalRequest.__csrfRetry = true;

            const nextToken = await refreshCsrfToken();

            if (nextToken) {
                originalRequest.headers = {
                    ...(originalRequest.headers || {}),
                    'X-CSRF-TOKEN': nextToken,
                };
            }

            return apiClient(originalRequest);
        }

        return Promise.reject(error);
    }
);

window.axios = apiClient;

export default apiClient;
