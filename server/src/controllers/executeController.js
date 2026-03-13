const axios = require("axios");

const JUDGE0_URL = "https://judge029.p.rapidapi.com";

const RAPIDAPI_HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
  "X-RapidAPI-Host": "judge029.p.rapidapi.com",
};

const LANGUAGE_MAP = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  typescript: 74,
  go: 60,
  rust: 73,
};

// ─── Get Available Languages ──────────────────────────────
const getRuntimes = async (req, res) => {
  try {
    const response = await axios.get(`${JUDGE0_URL}/languages`, {
      headers: RAPIDAPI_HEADERS,
    });
    res.status(200).json({ languages: response.data });
  } catch (error) {
    console.error(
      "Get languages error:",
      error?.response?.data || error.message,
    );
    res.status(500).json({ message: "Could not fetch languages" });
  }
};

// ─── Execute Code ─────────────────────────────────────────
const executeCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res
        .status(400)
        .json({ message: "Code and language are required" });
    }

    const languageId = LANGUAGE_MAP[language.toLowerCase()];

    if (!languageId) {
      return res
        .status(400)
        .json({ message: `Language "${language}" is not supported` });
    }

    // ── Step 1: Submit code ────────────────────────────
    const submitResponse = await axios.post(
      `${JUDGE0_URL}/submissions`,
      {
        source_code: Buffer.from(code).toString("base64"),
        language_id: languageId,
        stdin: "",
        encode_source_code: true,
      },
      {
        headers: RAPIDAPI_HEADERS,
        params: { base64_encoded: true, wait: false },
      },
    );

    const token = submitResponse.data.token;

    if (!token) {
      return res
        .status(500)
        .json({ message: "Submission failed — no token returned" });
    }

    // ── Step 2: Poll for result ────────────────────────
    let result = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const resultResponse = await axios.get(
        `${JUDGE0_URL}/submissions/${token}`,
        {
          headers: RAPIDAPI_HEADERS,
          params: { base64_encoded: true },
        },
      );

      const data = resultResponse.data;

      // Status 1 = In Queue, 2 = Processing, 3+ = Done
      if (data.status.id > 2) {
        result = data;
        break;
      }

      attempts++;
    }

    if (!result) {
      return res.status(408).json({ message: "Code execution timed out" });
    }

    // ── Step 3: Decode output ──────────────────────────
    const decode = (str) =>
      str ? Buffer.from(str, "base64").toString("utf-8") : null;

    const output = {
      stdout: decode(result.stdout),
      stderr: decode(result.stderr),
      compileOutput: decode(result.compile_output),
      status: result.status.description,
      exitCode: result.exit_code,
      time: result.time,
      memory: result.memory,
    };

    res.status(200).json({ output });
  } catch (error) {
    console.error("Execute error:", error?.response?.data || error.message);
    res.status(500).json({ message: "Code execution failed" });
  }
};

module.exports = { executeCode, getRuntimes };
