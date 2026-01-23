import * as pdfjsLib from 'pdfjs-dist';

// Use Vite's URL import to get the worker script from node_modules
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const extractTextFromPdf = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log(`PDF Loaded. Pages: ${pdf.numPages}`);
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Join with newline to preserve clear structure for lists/headers
            // Filter empty strings to avoid excess whitespace
            const pageText = textContent.items
                .map(item => item.str)
                .filter(str => str.trim().length > 0)
                .join('\n');

            fullText += `--- Page ${i} ---\n${pageText}\n`;
        }

        return fullText;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("Failed to extract text from PDF. Please ensure it is a valid PDF file.");
    }
};

export const readFileAsText = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};
