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

            let lastY = null;
            let pageLines = [];
            let currentLine = '';

            textContent.items.forEach((item) => {
                const str = item.str;
                const y = item.transform ? Math.round(item.transform[5]) : null;

                if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
                    // New line detected (Y position changed)
                    if (currentLine.trim()) pageLines.push(currentLine.trim());
                    currentLine = str;
                } else {
                    currentLine += str;
                }
                lastY = y;
            });
            if (currentLine.trim()) pageLines.push(currentLine.trim());

            // Add a page break marker only between pages, not as noise in the text
            if (i > 1) fullText += '\n';
            fullText += pageLines.join('\n');
        }

        // Clean up: collapse 3+ consecutive blank lines to 2
        fullText = fullText.replace(/\n{3,}/g, '\n\n').trim();

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
