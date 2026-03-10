import { execFile, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type MlResult = {
  priorita?: string;
  gruppo?: string;
  azioni_consigliate?: string;
  top5?: string[];
};

type WorkerResponse =
  | { id: number; ok: true; result: MlResult }
  | { id: number; ok: false; error: string };

const modelDir = path.resolve(process.cwd(), "..", "ML_Model");
const pythonExecutable = process.env.PYTHON_EXECUTABLE?.trim() || "python";
const workerScriptPath = path.join(modelDir, "worker.py");

let worker: ChildProcessWithoutNullStreams | null = null;
let workerExitPromiseBound = false;
let requestCounter = 0;
const pendingRequests = new Map<
  number,
  {
    resolve: (value: MlResult) => void;
    reject: (reason?: unknown) => void;
    timeout: NodeJS.Timeout;
  }
>();

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

function clearPendingRequests(reason: string) {
  for (const [id, pending] of pendingRequests.entries()) {
    clearTimeout(pending.timeout);
    pending.reject(new Error(reason));
    pendingRequests.delete(id);
  }
}

function ensureWorker() {
  if (worker && !worker.killed) return worker;

  worker = spawn(pythonExecutable, [workerScriptPath], {
    cwd: modelDir,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8"
    },
    stdio: "pipe"
  });

  const stdoutReader = readline.createInterface({ input: worker.stdout });
  stdoutReader.on("line", (line) => {
    let message: WorkerResponse;
    try {
      message = JSON.parse(line) as WorkerResponse;
    } catch {
      return;
    }

    const pending = pendingRequests.get(message.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingRequests.delete(message.id);

    if (message.ok) {
      pending.resolve(message.result);
      return;
    }

    pending.reject(new Error(message.error || "Errore worker ML"));
  });

  if (!workerExitPromiseBound) {
    worker.on("exit", () => {
      worker = null;
      workerExitPromiseBound = false;
      clearPendingRequests("Worker ML terminato");
    });

    worker.on("error", () => {
      worker = null;
      workerExitPromiseBound = false;
      clearPendingRequests("Errore worker ML");
    });

    worker.stderr.on("data", () => {
      // Il canale stderr resta disponibile per debug ma non blocca il flusso.
    });

    workerExitPromiseBound = true;
  }

  return worker;
}

async function inferTicketFallback(description: string) {
  const script = [
    "import json,sys",
    "from motore_ml import processa_ticket",
    "result = processa_ticket(sys.argv[1])",
    "print(json.dumps(result, ensure_ascii=False))"
  ].join(";");

  const { stdout } = await execFileAsync(pythonExecutable, ["-c", script, description], {
    cwd: modelDir,
    maxBuffer: 1024 * 1024 * 10,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8"
    }
  });

  return JSON.parse(stdout.trim()) as MlResult;
}

async function runWorkerInference(description: string) {
  const currentWorker = ensureWorker();
  const id = ++requestCounter;

  return new Promise<MlResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("Timeout worker ML"));
    }, 60000);

    pendingRequests.set(id, { resolve, reject, timeout });

    try {
      currentWorker.stdin.write(`${JSON.stringify({ id, description })}\n`);
    } catch (error) {
      clearTimeout(timeout);
      pendingRequests.delete(id);
      reject(error);
    }
  });
}

export async function inferTicket(description: string) {
  let parsed: MlResult;

  try {
    parsed = await runWorkerInference(description);
  } catch {
    parsed = await inferTicketFallback(description);
  }

  return {
    priority: normalizePriority(parsed.priorita),
    category: parsed.gruppo?.trim() || undefined,
    AzioniFatteInPassato: parsed.azioni_consigliate?.trim() || undefined,
    Top5: Array.isArray(parsed.top5) ? parsed.top5 : []
  };
}
