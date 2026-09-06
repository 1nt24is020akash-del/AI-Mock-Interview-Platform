const mammoth = require("mammoth");

/**
 * Extracts raw text from a DOCX buffer using mammoth.
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.warn("DOCX extraction error:", error.message);
    throw new Error(`Failed to extract text from DOCX file: ${error.message}`);
  }
}

module.exports = {
  extractTextFromDOCX,
};
