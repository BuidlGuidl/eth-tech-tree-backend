import { spawn } from "child_process";

interface CommandOutput {
  stdout: string;
  stderr: string;
}

interface ExecuteOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stream?: boolean; // if true, stream to process.stdout/stderr in real time
  shell?: boolean; // default true for convenience when passing full commands
}

/**
 * Execute a shell command and return the output
 * If stream is enabled, mirror stdout/stderr in real time while also capturing
 */
export async function execute(command: string, options: ExecuteOptions = {}): Promise<CommandOutput> {
  const { cwd, env, stream = false, shell = true } = options;

  return await new Promise<CommandOutput>((resolve) => {
    const child = spawn(command, { cwd, env, shell });

    let stdout = "";
    let stderr = "";

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (data: string) => {
      stdout += data;
      if (stream) process.stdout.write(data);
    });

    child.stderr?.on("data", (data: string) => {
      stderr += data;
      if (stream) process.stderr.write(data);
    });

    // Resolve regardless of exit code, mirroring previous behavior
    child.on("close", () => {
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}
