import { exec as execCb } from "child_process";
import { promisify } from "util";
const exec = promisify(execCb);

export async function executeCommand(command: string): Promise<void> {
  const { stdout, stderr } = await exec(command);
  if (stderr) {
    console.error(`stderr: ${stderr}\n`);
  }
  console.log(`stdout: ${stdout}\n`);
}
