import { encodeImage, isRemoteFile } from "../src/index";
import Together from "together-ai";

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

  const systemPrompt = `Extract key details from the provided ID card image and format them as JSON. The JSON object should include the following fields:

  - full_name: The full name of the cardholder.
  - id_number: The unique identification number on the card.
  - date_of_birth: The date of birth of the cardholder (YYYY-MM-DD format).
  - nationality: The nationality of the cardholder.
  - expiration_date: The expiry date of the ID card (YYYY-MM-DD format).
  
  Ensure that:
  - The output is in pure JSON format.
  - If any field is missing, return an empty string for that field.
  `;

  console.log("📸 Encoding image...");
  const finalImageUrl = isRemoteFile(filePath)
    ? filePath
    : `data:image/jpeg;base64,${encodeImage(filePath)}`;

  console.log("🧠 Calling Together AI API...");

  try {
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
    return output.choices[0]?.message?.content || "⚠️ No response content!";
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

  const filePath = "./test/amine.jpeg"; // Replace with actual path
  console.log(`📂 Processing file: ${filePath}`);

  const response = await getMarkDown({
    together,
    visionLLM: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
    filePath,
  });

  console.log("📝 OCR Result:", response);
}

// Run the function
runOCR();
