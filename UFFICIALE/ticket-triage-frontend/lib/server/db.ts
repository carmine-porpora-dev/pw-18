import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const pythonExecutable = process.env.PYTHON_EXECUTABLE?.trim() || "python";
const gatewayPath = path.resolve(process.cwd(), "lib", "server", "db_gateway.py");

type DbCommand =
  | "list_tickets"
  | "get_ticket"
  | "create_ticket"
  | "update_ticket_ml"
  | "dashboard_summary"
  | "authenticate_user"
  | "get_user_by_id"
  | "get_group_id_by_name";

export async function runDb<T>(command: DbCommand, payload?: object): Promise<T> {
  const args = [gatewayPath, command];
  if (payload) {
    args.push(JSON.stringify(payload));
  }

  try {
    const { stdout } = await execFileAsync(pythonExecutable, args, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8"
      }
    });
    return JSON.parse(stdout.trim()) as T;
  } catch (error: any) {
    const stderr = error?.stderr ? String(error.stderr).trim() : "";
    const reason = stderr || error?.message || "Errore sconosciuto";
    throw new Error(`Errore DB: ${reason}`);
  }
}
