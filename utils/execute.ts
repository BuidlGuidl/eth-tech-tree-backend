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
  const { stdout, stderr } = await exec(command);
  if (stderr.trim()) {
    console.error(`stderr: ${stderr}\n`);
  }
  if (stdout.trim()) {
    console.log(`stdout: ${stdout}\n`);
  }
  return { stdout, stderr };
}
