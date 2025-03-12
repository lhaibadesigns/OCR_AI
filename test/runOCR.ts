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
  