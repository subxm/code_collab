import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const useExecution = () => {
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  const runCode = async (code, language) => {
    try {
      setIsRunning(true);
      setError(null);
      setOutput(null);

      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_URL}/api/execute/run`,
        { code, language },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setOutput(response.data.output);
    } catch (err) {
      setError(err.response?.data?.message || "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput(null);
    setError(null);
  };

  return { output, isRunning, error, runCode, clearOutput };
};

export default useExecution;
