import fs from "fs";

async function main() {
  let markdown = await ocr({
    filePath: "./test/id-card.jpg", // Change this to your ID card image path
    apiKey: process.env.TOGETHER_API_KEY,
  });

  try {
    const jsonData = JSON.parse(markdown); // Convert Markdown to JSON
    fs.writeFileSync("./output.json", JSON.stringify(jsonData, null, 2));
    console.log("Extracted ID data saved to output.json");
  } catch (error) {
    console.error("Failed to parse JSON:", error);
  }
}

main();
