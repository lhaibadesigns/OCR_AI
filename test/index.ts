import { encodeImage, isRemoteFile } from "../src/index";
import Together from "together-ai";
import fs from 'fs';

async function getMarkDown({
  together,
  visionLLM,
  filePath,
}: {
  together: Together;
  visionLLM: string;
  filePath: string;
}) {
  console.log("🔵 getMarkDown() started...");

  // System prompt with clear instructions to extract specific fields from the ID card
  const systemPrompt = `
  You are an advanced OCR model tasked with extracting key details from an ID card image. The image may contain varying formats, but you must accurately extract the following fields and return them in a **valid JSON format**:
  
  - **full_name**: The full name of the cardholder exactly as it appears on the ID card. 
  - **id_number**: The unique identification number on the card. This may be labeled as "ID Number," "Card Number," or something similar.
  - **date_of_birth**: The date of birth of the cardholder in **YYYY-MM-DD** format. It may appear as "DOB" or "Date of Birth."
  - **nationality**: The nationality of the cardholder (e.g., "American," "Chinese").
  - **expiration_date**: The expiry date of the ID card in **YYYY-MM-DD** format. This may be labeled as "Expiration Date," "Valid Until," or similar.
  
  ### Guidelines:
  1. The **output should be pure JSON**, no additional explanations, headers, or extraneous text.
  2. If a field is missing or unreadable, return an empty string ("") for that field.
  3. Ensure the data is correctly parsed and matches the format shown above. 
  4. If there are any distortions or unclear text in the image, do your best to extract the correct information. 
  
  For example, the correct JSON output should look like:
  {
    "full_name": "John Doe",
    "id_number": "1234567890",
    "date_of_birth": "1980-01-01",
    "nationality": "American",
    "expiration_date": "2030-01-01"
  }
  
  Make sure your output is **accurate and matches the format** exactly as shown above.
  `;

  console.log("📸 Encoding image...");
  const finalImageUrl = isRemoteFile(filePath)
    ? filePath
    : `data:image/jpeg;base64,${encodeImage(filePath)}`;

  console.log("🧠 Calling Together AI API...");

  try {
    // Making API request to Together AI
    const output = await together.chat.completions.create({
      model: visionLLM,
      messages: [
        {
          role: "user",
          content: JSON.stringify([
            { type: "text", text: systemPrompt },
            { type: "image_url", image_url: { url: finalImageUrl } },
          ]),
        },
      ],
    });

    console.log("✅ API response received!");

    // Log the raw response for debugging purposes
    console.log("Raw API response:", JSON.stringify(output, null, 2));

    // Extract JSON from the response
    const jsonResult = output.choices[0]?.message?.content || "";

    // **NEW: Extract valid JSON portion**
    const jsonMatch = jsonResult.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ No valid JSON found in response:", jsonResult);
      throw new Error("API response is not in valid JSON format!");
    }

    const jsonText = jsonMatch[0];

    try {
      const parsedResult = JSON.parse(jsonText);
      const fileName = 'id_card_details.json';
      fs.writeFileSync(fileName, JSON.stringify(parsedResult, null, 2));

      console.log(`✅ JSON data saved to ${fileName}`);
      return parsedResult;  // Returning valid JSON instead of raw text
    } catch (parseError) {
      console.error("❌ Error parsing extracted JSON:", jsonText);
      throw new Error("Failed to parse API response as JSON!");
    }

  } catch (error) {
    console.error("❌ Error calling Together AI:", error);
  }
}

// Example usage
async function runOCR() {
  console.log("🚀 Running OCR process...");
  const together = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
  });

  const filePath = "./amine.jpeg"; // Replace with actual path
  console.log(`📂 Processing file: ${filePath}`);

  try {
    const response = await getMarkDown({
      together,
      visionLLM: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
      filePath,
    });

    console.log("📝 OCR Result:", response);
  } catch (error) {
    console.error("❌ Error during OCR process:", error);
  }
}

// Run the function
runOCR();
