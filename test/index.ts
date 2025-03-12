import { encodeImage, isRemoteFile } from "../src/index";
import Together from "together-ai";
import fs from 'fs';  // Import the fs module to write files

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

    // Parse the output and write it to a JSON file
    const jsonResult = output.choices[0]?.message?.content || "⚠️ No response content!";
    
    // Try to parse it into JSON and save it
    try {
      const parsedResult = JSON.parse(jsonResult);

      const fileName = 'id_card_details.json';
      fs.writeFileSync(fileName, JSON.stringify(parsedResult, null, 2));

      console.log(`✅ JSON data saved to ${fileName}`);
    } catch (parseError) {
      console.error("❌ Error parsing the response:", parseError);
    }

    return jsonResult;
  } catch (error) {
    console.error("❌ Error calling Together AI:", error);
  }
}
