const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// We use llama-3.3-70b — free, fast, excellent at code
const MODEL = "llama-3.3-70b-versatile";

// ─── Helper: clean markdown fences from response ──────────
const cleanResponse = (text) => {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
};

// ─── Helper: single call to Groq ─────────────────────────
const generate = async (systemPrompt, userPrompt) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3, // lower = more focused, less random
    max_tokens: 2048,
  });
  return response.choices[0].message.content;
};

// ─── 1. AI Chat Assistant ─────────────────────────────────
const chatAssistant = async (req, res) => {
  try {
    const { message, code, language, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const codeContext = code
      ? `The user is currently working on this ${language || "javascript"} code:\n\`\`\`${language}\n${code}\n\`\`\``
      : "";

    const systemPrompt = `
      You are an expert coding assistant inside CodeCollab, a real-time collaborative coding platform.
      Be concise, helpful, and always provide code examples when relevant.
      ${codeContext}
    `;

    // Build conversation messages including history
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    });

    const reply = response.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ message: "AI chat failed" });
  }
};

// ─── 2. AI Code Review ────────────────────────────────────
const reviewCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const systemPrompt = `
      You are an expert code reviewer.
      Always respond with ONLY a valid JSON array — no explanation, no markdown, no extra text.
      If there are no issues, return an empty array: []
    `;

    const userPrompt = `
      Review this ${language || "code"} and return a JSON array of issues.
      Each issue must have exactly these fields:
      - line: (number) line number of the issue
      - severity: (string) one of "error", "warning", "suggestion"
      - message: (string) short description
      - fix: (string) how to fix it

      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    const raw = await generate(systemPrompt, userPrompt);
    const cleaned = cleanResponse(raw);

    let issues = [];
    try {
      issues = JSON.parse(cleaned);
    } catch {
      issues = [];
    }

    res.status(200).json({ issues });
  } catch (error) {
    console.error("Review error:", error.message);
    res.status(500).json({ message: "AI review failed" });
  }
};

// ─── 3. AI Auto-fix ───────────────────────────────────────
const autoFix = async (req, res) => {
  try {
    const { code, error, language } = req.body;

    if (!code || !error) {
      return res.status(400).json({ message: "Code and error are required" });
    }

    const systemPrompt = `
      You are an expert code debugger.
      Always respond with ONLY a valid JSON object — no explanation, no markdown, no extra text.
    `;

    const userPrompt = `
      Fix this ${language || "code"} that has the following error: ${error}

      Code:
      \`\`\`${language}
      ${code}
      \`\`\`

      Return ONLY a JSON object with:
      - fixedCode: (string) the complete fixed code
      - explanation: (string) one short sentence explaining what was wrong
    `;

    const raw = await generate(systemPrompt, userPrompt);
    const cleaned = cleanResponse(raw);

    let parsed = { fixedCode: code, explanation: "Could not auto-fix" };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // fallback to original code
    }

    res.status(200).json({
      fixedCode: parsed.fixedCode,
      explanation: parsed.explanation,
    });
  } catch (error) {
    console.error("Auto-fix error:", error.message);
    res.status(500).json({ message: "AI auto-fix failed" });
  }
};

// ─── 4. AI Code Completion ────────────────────────────────
const completeCode = async (req, res) => {
  try {
    const { code, language, cursorPosition } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const codeUpToCursor = code.slice(0, cursorPosition || code.length);

    const systemPrompt = `
      You are a code completion engine.
      Return ONLY the completion text — not the full code, just what comes next.
      1-5 lines maximum. No explanation. No markdown. No backticks.
    `;

    const userPrompt = `
      Complete this ${language || "javascript"} code from where it ends:
      ${codeUpToCursor}
    `;

    const raw = await generate(systemPrompt, userPrompt);
    const completion = cleanResponse(raw);

    res.status(200).json({ completion });
  } catch (error) {
    console.error("Completion error:", error.message);
    res.status(500).json({ message: "AI completion failed" });
  }
};

module.exports = { chatAssistant, reviewCode, autoFix, completeCode };
