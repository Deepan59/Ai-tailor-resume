import { supabase } from './supabase';
import { generateResponse } from './gemini';

// Helper to get current user
const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
};

export const auth = {
  // These are now largely handled by AuthContext interacting with Supabase directly,
  // but keeping them if needed for compatibility or extended logic.
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Map Supabase user structure to our app's expected structure if needed
      return {
        ...user,
        name: user.user_metadata?.name || user.email,
        email: user.email,
        plan: user.app_metadata?.plan || 'Free Plan'
      };
    }
    return null;
  }
};

export const resume = {
  upload: async (file) => {
    const user = await getUser();
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    // 1. Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file);

    if (storageError) throw new Error(storageError.message);

    // 1.5 Get current resume count for naming
    const { count } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const nextNumber = (count || 0) + 1;
    const defaultTitle = `Resume ${nextNumber}`;

    // 2. Insert record into Database
    const { data: dbData, error: dbError } = await supabase
      .from('resumes')
      .insert([
        {
          user_id: user.id,
          file_path: filePath,
          job_title: defaultTitle,
          company: ' '
        }
      ])
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    return { resumeId: dbData.id, filePath };
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

      // Update the database record
      await supabase
        .from('resumes')
        .update({
          job_title: inferredTitle,
          company: 'Target Company', // Could be extracted if we parse more, but this is safe
          updated_at: new Date()
        })
        .eq('id', resumeId);

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
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Map to frontend expectation
    return data.map(r => ({
      id: r.id,
      jobTitle: r.job_title || 'Untitled',
      company: r.company || 'Unknown',
      date: r.created_at
    }));
  },

  download: async (id) => {
    // Logic to get signed URL for the file
    // First get the file path from DB
    const { data: resumeRecord, error: dbError } = await supabase
      .from('resumes')
      .select('file_path')
      .eq('id', id)
      .single();

    if (dbError) throw new Error(dbError.message);

    const { data, error: signedUrlError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resumeRecord.file_path, 60);

    if (signedUrlError) throw new Error(signedUrlError.message);

    // Redirect or return the URL
    // Since expected return is a blob usually, we might need to fetch it or just return URL.
    // The previous API expected a BLOB response.
    // Let's change the calling code to handle URL redirect, or fetch it here.
    // Fetching here for compatibility:
    const response = await fetch(data.signedUrl);
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

export default supabase;
