// A tiny wrapper around fetch() so every part of the app talks to the API
// the same way: same base URL, same auth header, same error handling.

const BASE_URL = 'http://localhost:5000/api'; // ASP.NET Core default HTTP dev port

function getToken() {
    return localStorage.getItem('labtrack_token');
}

async function request(
    path,
    { method = 'GET', body, isFormData = false } = {}
) {
    const headers = {};

    const token = getToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body
            ? (isFormData ? body : JSON.stringify(body))
            : undefined,
    });

    if (response.status === 204) {
        return null;
    }

    const contentType =
        response.headers.get('content-type') || '';

    const data = contentType.includes('application/json')
        ? await response.json()
        : null;

    if (!response.ok) {
        const message =
            data?.message ||
            data?.Message ||
            `Request failed (${response.status})`;

        throw new Error(message);
    }

    return data;
}


// ============================================================
// GET ORIGINAL FILE AS BLOB
// ============================================================
//
// This is used for:
//
// GET /api/documents/{id}/file
//
// Unlike normal API requests, this endpoint returns the
// ORIGINAL PDF/TXT file instead of JSON.
//
// We therefore use response.blob().
//
// The Authorization header is still included because the
// DocumentsController requires authentication.
//

async function getBlob(path) {
    const headers = {};

    const token = getToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        let message = `Request failed (${response.status})`;

        try {
            const contentType =
                response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                const data = await response.json();

                message =
                    data?.message ||
                    data?.Message ||
                    message;
            }
        } catch {
            // Keep the default error message if the response
            // cannot be parsed.
        }

        throw new Error(message);
    }

    return await response.blob();
}


// ============================================================
// API
// ============================================================

export const api = {

    // Normal JSON GET request
    get: (path) =>
        request(path),

    // Normal JSON POST request
    post: (path, body) =>
        request(path, {
            method: 'POST',
            body
        }),

    // Multipart/form-data POST request
    postForm: (path, formData) =>
        request(path, {
            method: 'POST',
            body: formData,
            isFormData: true
        }),

    // PUT request
    put: (path, body) =>
        request(path, {
            method: 'PUT',
            body
        }),

    // PATCH request
    patch: (path, body) =>
        request(path, {
            method: 'PATCH',
            body
        }),

    // DELETE request
    del: (path) =>
        request(path, {
            method: 'DELETE'
        }),

    // Original file request
    //
    // Returns a Blob instead of JSON.
    //
    getBlob: (path) =>
        getBlob(path),
};