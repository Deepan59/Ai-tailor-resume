const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const generateResponse = async (prompt) => {
    try {
        const response = await fetch(`${API_URL}/api/groq/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.message || 'Failed to generate content');
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Error calling backend API:", error);
        throw new Error(`Failed to generate content. ${error.message}`);
    }
};
