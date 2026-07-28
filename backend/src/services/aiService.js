const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Get API Key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * AI Dental Image Analysis Service
 * Uses Google Gemini API to analyze images.
 * Strict validation for teeth images.
 */
const isRetryableError = (error) => {
  const msg = error.message || '';
  if (msg.includes('Only teeth images are allowed') || msg.includes('INVALID_IMAGE')) {
    return false;
  }
  if (msg.includes('API key') || msg.includes('API_KEY') || msg.includes('400') || msg.includes('401') || msg.includes('403')) {
    return false;
  }
  return true;
};

/**
 * AI Dental Image Analysis Service
 * Uses Google Gemini API to analyze images.
 * Strict validation for teeth images.
 */
async function analyzeImage(imagePath) {
  try {
    // 1. Preprocess image
    const imageMetadata = await sharp(imagePath).metadata();
    console.log('Image metadata:', imageMetadata.width, 'x', imageMetadata.height, imageMetadata.format);

    // 2. Prepare image for Gemini
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    
    const parts = [
      { text: `
        Analyze this dental image. 
        First, strictly determine if this is a clear image of human teeth or a dental X-ray.
        If the image is NOT related to human teeth, dental anatomy, or oral health (for example, it's a face, a pet, or an object), 
        your response MUST be exactly: "INVALID_IMAGE".
        
        If it is a valid dental image, provide a JSON response with the following structure:
        {
          "issueDetected": boolean,
          "confidence": number, // 0 to 100
          "conditions": [string], // e.g. ["Cavity", "Tartar"]
          "severity": string, // "none", "mild", "moderate", "severe"
          "description": string // A professional, reassuring summary for the patient (max 200 words).
        }
        
        Be scientific but empathetic in the description. Mention if a professional checkup is needed.
      `},
      {
        inlineData: {
          mimeType: imageMetadata.format === 'png' ? 'image/png' : 'image/jpeg',
          data: base64Image
        }
      }
    ];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let attempts = 0;
    const maxAttempts = 3;
    let lastError;

    const timeoutLimit = process.env.NODE_ENV === 'test' ? 100 : 15000;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        // 15 seconds timeout (shortened in test mode)
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutLimit);
        });

        const generatePromise = (async () => {
          const res = await model.generateContent({ contents: [{ role: "user", parts }] });
          clearTimeout(timeoutId);
          return res;
        })();

        const result = await Promise.race([generatePromise, timeoutPromise]);
        const responseText = result.response.text().trim();

        // 4. Parse response
        if (responseText === "INVALID_IMAGE" || responseText.includes("INVALID_IMAGE")) {
          throw new Error("Only teeth images are allowed");
        }

        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("AI analysis failed to provide a structured report. " + responseText);
        }
        
        const analysis = JSON.parse(jsonMatch[0]);
        
        return {
          issueDetected: !!analysis.issueDetected,
          confidence: analysis.confidence || 80,
          conditions: Array.isArray(analysis.conditions) ? analysis.conditions : [],
          severity: ['none', 'mild', 'moderate', 'severe'].includes(analysis.severity) ? analysis.severity : 'none',
          description: analysis.description || "Analysis completed. No specific description available."
        };

      } catch (error) {
        console.error(`AI Service Attempt ${attempts} Error:`, error);
        lastError = error;

        if (attempts < maxAttempts && isRetryableError(error)) {
          const delay = attempts === 1 
            ? (process.env.NODE_ENV === 'test' ? 10 : 2000) 
            : (process.env.NODE_ENV === 'test' ? 20 : 4000);
          console.log(`AI Service attempt ${attempts} failed. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    throw lastError;

  } catch (error) {
    console.error('AI Service Final Error:', error);
    if (error.message === "Only teeth images are allowed") throw error;
    throw new Error("AI service is currently unavailable. " + error.message);
  }
}

module.exports = analyzeImage;
