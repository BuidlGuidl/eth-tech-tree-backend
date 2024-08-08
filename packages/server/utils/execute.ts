import { exec as execCb } from "child_process";
import { promisify } from "util";
const exec = promisify(execCb);

interface CommandOutput {
  stdout: string;
  stderr: string;
}

/**
 * Execute a shell command and return the output
 * Console.log only if there is output
 */
export async function execute(command: string): Promise<CommandOutput> {
  let stdout, stderr;
  try {
    const result = await exec(command);
    stdout = result.stdout?.trim();
    stderr = result.stderr?.trim();
  } catch (failed: any) {
    stdout = failed.stdout?.trim();
    stderr = failed.stderr?.trim();
  }
  return { stdout, stderr };
}
