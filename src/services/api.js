import { generateResponse } from './gemini';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getToken = () => localStorage.getItem('token');

// Helper to get user profile from JWT
export const auth = {
  getUser: async () => {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to get user:', err);
    }
    return null;
  }
};

export const resume = {
  upload: async (file) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/resumes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to upload resume');
    }

    const data = await response.json();
    return { resumeId: data.resumeId, filePath: data.filePath };
  },

  tailor: async (resumeId, resumeText, jobDescription) => {
    try {
      const prompt = `
        You are an expert Resume Writer.
        I will provide you with my current resume text and a target job description.
        Your task is to REWRITE the resume to target the job description, but you must MAINTAIN THE FULL LENGTH and DETAIL of the original.

        CRITICAL INSTRUCTIONS:
        1. DO NOT SUMMARIZE. The output must be as long or longer than the original.
        2. Keep ALL job history, ALL education, and ALL projects.
        3. Only REPHRASE bullet points to use keywords from the Job Description (e.g., "Full Stack", "Node.js").
        4. In "Skills", prioritize skills mentioned in the Job Description and format them as a comma-separated list (e.g., "React, Node.js, SQL") to save space.
        5. DO NOT invent false experience, but you can rephrase existing experience to use keywords from the description.
        6. Return ONLY the markdown text of the new resume. Do not include any conversational filler.
        7. CRITICAL: Do NOT summarize the experience. Retain all jobs and details from the original resume, just rephrased. The output must be the FULL resume. No intro/outro.

        Current Resume Text:
        ${resumeText}

        Target Job Description:
        ${jobDescription}
        `;

      const tailoredContent = await generateResponse(prompt);

      // Extract a simple job title from the description (first line or first few words)
      const inferredTitle = jobDescription.split('\n')[0].substring(0, 40).trim() || 'Tailored Position';

      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      // Update the database record on the backend
      const response = await fetch(`${API_URL}/api/resumes/${resumeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobTitle: inferredTitle,
          company: 'Target Company',
          originalText: resumeText,
          tailoredText: tailoredContent
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update resume details');
      }

      return {
        originalText: resumeText,
        tailoredText: tailoredContent,
        tailoredResumeId: resumeId
      };
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw new Error("Failed to generate tailored resume: " + error.message);
    }
  },

  getHistory: async () => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/resumes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to fetch resume history');
    }

    const data = await response.json();
    return data;
  },

  download: async (id) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/resumes/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download resume file');
    }

    const blob = await response.blob();
    return blob;
  },
};

export const usage = {
  check: async () => {
    // Return unlimited usage
    return { used: 0, limit: 999999 };
  }
};

export const payment = {
  createOrder: async (planId) => {
    return { id: "free", amount: 0, currency: "USD" };
  },
  verify: async (paymentData) => {
    return { success: true };
  }
};

export default { auth, resume, usage, payment };
