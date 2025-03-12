import Together from "together-ai";
import fs from "fs";

// Exported utility functions  
export function encodeImage(imagePath: string): string {
  const imageFile = fs.readFileSync(imagePath);
  return Buffer.from(imageFile).toString("base64");
}

export function isRemoteFile(filePath: string): boolean {
  return filePath.startsWith("http://") || filePath.startsWith("https://");
}

export async function ocr({
  filePath,
  apiKey = process.env.TOGETHER_API_KEY,
  model = "Llama-3.2-90B-Vision",
}: {
  filePath: string;
  apiKey?: string;
  model?: "Llama-3.2-90B-Vision" | "Llama-3.2-11B-Vision" | "free";
}) {
  const visionLLM =
    model === "free"
      ? "meta-llama/Llama-Vision-Free"
      : `meta-llama/${model}-Instruct-Turbo`;

  const together = new Together({
    apiKey,
  });

  return await getMarkDown({ together, visionLLM, filePath });
}

async function getMarkDown({
  together,
  visionLLM,
  filePath,
}: {
  together: Together;
  visionLLM: string;
  filePath: string;
}) {
  const systemPrompt = `Extract key details from the provided ID card image and return a JSON object with the following fields:

  - full_name: The full name of the cardholder.
  - id_number: The unique identification number on the card.
  - date_of_birth: The date of birth of the cardholder (YYYY-MM-DD format).
  - nationality: The nationality of the cardholder.
  - expiration_date: The expiry date of the ID card (YYYY-MM-DD format).

  **Rules**:
  - Return **only** JSON.
  - Do **not** include any explanations, headers, or extra text.
  - If a field is missing, set it to an empty string "".
  `;

  const finalImageUrl = isRemoteFile(filePath)
    ? filePath
    : `data:image/jpeg;base64,${encodeImage(filePath)}`;

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

    // Log the raw API response for debugging
    console.log("✅ API response received:", JSON.stringify(output, null, 2));

    const jsonResult = output.choices[0]?.message?.content?.trim() || "";

    // Extract only the JSON part if there's additional text
    const jsonMatch = jsonResult.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ No valid JSON found in response:", jsonResult);
      throw new Error("API response did not return valid JSON!");
    }

    const parsedJson = JSON.parse(jsonMatch[0]);
    return parsedJson;

  } catch (error) {
    console.error("❌ Error during OCR processing:", error);
    throw error;
  }
}
