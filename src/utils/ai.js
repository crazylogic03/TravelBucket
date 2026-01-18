const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function aiRecommend(city, country) {
  const prompt = `
You are a travel assistant.

City: ${city}
Country: ${country}

Respond ONLY in valid JSON.

{
  "description": "2–3 line overview",
  "whyVisit": "Why someone should visit",
  "tags": ["tag1", "tag2", "tag3"],
  "places": [
    {
      "name": "Place name",
      "bestTime": "Best time to visit"
    }
  ],
  "famousThings": [
    "Famous food, item, culture, or attraction"
  ]
}
`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error("Gemini error:", err)
    throw new Error("Gemini request failed")
  }

  const data = await res.json()
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text

  // Clean up markdown code blocks if present
  text = text.replace(/```json/g, "").replace(/```/g, "").trim()

  return JSON.parse(text)
}
