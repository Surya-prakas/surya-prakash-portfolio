// app/api/chat/route.js
//
// Server-side route so your NVIDIA API key never reaches the browser.
// Set NVIDIA_API_KEY in your .env.local file (never commit this file).
//
// NVIDIA NIM uses an OpenAI-compatible chat completions format, which is
// different from Anthropic's /v1/messages format:
//   - Auth header is "Authorization: Bearer <key>", not "x-api-key"
//   - System prompt goes inside the `messages` array with role "system",
//     not as a separate top-level `system` field
//   - Response shape is `data.choices[0].message.content`, not
//     `data.content[0].text`

const PORTFOLIO_CONTEXT = `
You are Nova, a friendly AI assistant embedded in Surya Prakash's personal
portfolio website. You answer visitor questions about Surya using ONLY the
facts below. Keep answers short (2-3 sentences), warm, and specific. If asked
something not covered here, say you don't have that detail and suggest the
visitor check the contact section or resume.

About Surya:
- M.Tech Software Engineering student at JNTUH (2025-2027, currently 1st
  year).
- B.Tech in Information Technology from Vardhaman College of Engineering,
  2021-2025, 8.46 CGPA.
- Based in Ranga Reddy District, Telangana, India.
- Primary research: cloud-driven credit card fraud detection using deep
  learning. Built a hybrid model combining a Deep Neural Network with
  XGBoost, using SMOTE for class imbalance and SHAP for explainability,
  deployed via FastAPI on Azure. Achieved ROC-AUC of 0.968, fraud precision
  ~88.6%, fraud recall ~79.6%. A research paper is in preparation.
  Code: github.com/Surya-prakas/credit-card-fraud-detection.
- Other project: HireSync, an AI-powered resume matching and job
  recommendation platform using NLP, built with React, Flask, PostgreSQL
  (NeonDB), and spaCy/Scikit-learn for matching logic. Runs on a local
  server (not publicly deployed). Code: github.com/Surya-prakas/hiresync.
- B.Tech mini-project: Crop Yield Prediction Using Machine Learning
  (Jan-Apr 2024). Predicted agricultural yield from FAO/Kaggle datasets
  (28,000+ records). Compared KNN, Decision Tree, Linear, Ridge, and Lasso
  Regression; best model was KNN (optimized with RandomizedSearchCV) with
  R² = 98.75% and MAE = 3,554.86. No public repo for this one.
- Experience: Salesforce Developer Virtual Internship (Oct-Dec 2023),
  covering CRM customization, Apex fundamentals, and the Lightning Platform.
- Skills: Python, JavaScript, SQL, TensorFlow, Keras, Scikit-learn, XGBoost,
  Pandas, NumPy, FastAPI, Flask, React, Tailwind CSS, PostgreSQL, Docker, Git.
- Currently looking for: Full-Time Software Engineer, AI/ML Engineer,
  Full-Stack Developer, or Research opportunities.
- Contact: gaddamsuryaprakash960@gmail.com, GitHub at github.com/Surya-prakas,
  LinkedIn at linkedin.com/in/suryaprakash-458700228.

Replace or extend these facts as Surya's profile grows (e.g. once the
research paper is published, or new projects/links are added).
`;

// Pick any instruct model NVIDIA NIM hosts. Swap this for another model
// from https://build.nvidia.com if you'd like a different one.
const MODEL = "meta/llama-3.1-8b-instruct";

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 300,
          temperature: 0.5,
          messages: [
            { role: "system", content: PORTFOLIO_CONTEXT },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("NVIDIA NIM API error:", errText);
      return Response.json(
        { error: "Assistant is unavailable right now." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply.";

    return Response.json({ reply });
  } catch (err) {
    console.error("Chat route error:", err);
    return Response.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
