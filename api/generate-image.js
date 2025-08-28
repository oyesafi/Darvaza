import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const REPLICATE_KEY = process.env.REPLICATE_API_KEY;
  const { prompt } = req.body;

  try {
    // Start prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "eaa438b7d90e1565d7d6c84a54fa1eb6d25f42a561bb552c4c32f3a617ac5b11", // Stable Diffusion 1.5
        input: { prompt }
      })
    });

    const prediction = await response.json();

    // Poll until image is ready
    let imageUrl = "";
    while (!imageUrl) {
      await new Promise(r => setTimeout(r, 3000));
      const check = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${REPLICATE_KEY}` }
      });
      const updated = await check.json();
      if (updated.output) {
        imageUrl = updated.output[0];
        break;
      }
      if (updated.status === "failed") {
        return res.status(500).json({ error: "Image generation failed." });
      }
    }

    res.status(200).json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}