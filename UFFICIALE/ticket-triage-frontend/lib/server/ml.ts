import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type MlResult = {
  priorita?: string;
  gruppo?: string;
  azioni_consigliate?: string;
  top5?: string[];
};

const modelDir = path.resolve(process.cwd(), "..", "ML_Model");
const pythonExecutable = process.env.PYTHON_EXECUTABLE?.trim() || "python";

function normalizePriority(raw: string | undefined) {
  if (!raw) return undefined;
  const value = raw.trim().toLowerCase();

  if (value.includes("critical") || value.includes("critica")) return "critical" as const;
  if (value.includes("high") || value.includes("alta")) return "high" as const;
  if (value.includes("planning") || value.includes("pianificazione")) return "high" as const;
  if (value.includes("medium") || value.includes("moderata")) return "medium" as const;
  if (value.includes("low") || value.includes("bassa")) return "low" as const;
  return undefined;
}

export async function inferTicket(description: string) {
  const script = [
    "import json,sys",
    "from motore_ml import processa_ticket",
    "result = processa_ticket(sys.argv[1])",
    "print(json.dumps(result, ensure_ascii=False))"
  ].join(";");

  const { stdout } = await execFileAsync(pythonExecutable, ["-c", script, description], {
    cwd: modelDir,
    maxBuffer: 1024 * 1024 * 10
  });

  const parsed = JSON.parse(stdout.trim()) as MlResult;

  return {
    priority: normalizePriority(parsed.priorita),
    category: parsed.gruppo?.trim() || undefined,
    AzioniFatteInPassato: parsed.azioni_consigliate?.trim() || undefined,
    Top5: Array.isArray(parsed.top5) ? parsed.top5 : []
  };
}
