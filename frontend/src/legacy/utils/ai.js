const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

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
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error("Groq error:", err)
    throw new Error("Groq request failed")
  }

  const data = await res.json()
  let text = data?.choices?.[0]?.message?.content

  // Clean up markdown code blocks if present
  text = text.replace(/```json/g, "").replace(/```/g, "").trim()

  return JSON.parse(text)
}
