const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Upload user avatar
 */
export const uploadAvatar = async (token, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/users/avatar`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        let errorMessage = 'Failed to upload avatar';
        if (data.detail) {
            if (Array.isArray(data.detail)) {
                errorMessage = data.detail[0]?.msg || data.detail[0]?.message || errorMessage;
            } else if (typeof data.detail === 'string') {
                errorMessage = data.detail;
            }
        }
        throw new Error(errorMessage);
    }

    return data;
};

/**
 * Update user profile
 */
export const updateProfile = async (token, userData) => {
    const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        let errorMessage = 'Failed to update profile';
        if (data.detail) {
            if (Array.isArray(data.detail)) {
                errorMessage = data.detail[0]?.msg || data.detail[0]?.message || errorMessage;
            } else if (typeof data.detail === 'string') {
                errorMessage = data.detail;
            }
        }
        throw new Error(errorMessage);
    }

    return data;
};