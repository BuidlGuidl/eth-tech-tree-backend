import { IGasReport } from "../mongodb/models/user";
import { SubmissionConfig } from "../types";

interface TestResult {
  name: string;
  gas: number;
  reason?: string;
}

interface PassFailResults {
  passed: boolean;
  passingTests: Record<string, TestResult>;
  failingTests: Record<string, TestResult>;
  error?: string;
}

interface ParsedResults extends PassFailResults {
  gasReport: IGasReport[];
}

export const parseTestResults = (submissionConfig: SubmissionConfig, output: string): ParsedResults => {
  const testResults = parseTestOutput(output);
  const gasTableResults = parseGasTable(submissionConfig, output);

  return {
    ...testResults,
    gasReport: gasTableResults
  };
};

const parseTestOutput = (output: string): PassFailResults => {
  const results: PassFailResults = {
    passed: false,
    passingTests: {},
    failingTests: {},
  };

  // Split the output into individual lines
  const lines = output.split('\n');

  // Iterate through the lines and parse the relevant information
  for (const line of lines) {
    // Check for passing tests
    const passingTestMatch = line.match(/\[PASS\] (\w+)\(\) \(gas: (\d+)\)/);
    if (passingTestMatch) {
      const [, testName, gas] = passingTestMatch;
      results.passingTests[testName] = {
        name: testName,
        gas: parseInt(gas)
      };
    }

    // Check for failing tests
    const failingTestMatch = line.match(/\[FAIL[(. Reason:)|:] (.*)\] (\w+)\(\) \(gas: (\d+)\)/);
    if (failingTestMatch) {
      const [, reason, testName, gas] = failingTestMatch;
      results.failingTests[testName] = {
        name: testName,
        reason,
        gas: parseInt(gas)
      };
    }
  }

  // If there are no passing or failing tests, there was an error
  if (Object.keys(results.failingTests).length === 0 && Object.keys(results.passingTests).length === 0) {
    results.error = output;
    console.log("Error occurred during test execution");
    console.error(output);
    return results;
  }

  if (Object.keys(results.failingTests).length === 0) {
    results.passed = true;
    console.log("🟢 Passed all tests");
  } else {
    console.log("🔴 Failed some tests");
  }

  return results;
};

const parseGasTable = (submissionConfig: SubmissionConfig, output: string): IGasReport[] => {
  const { challenge, contractAddress } = submissionConfig;
  const contractName = challenge.contractName.replace(".sol", "");
  const results: IGasReport[] = [];
  const lines = output.split('\n');

  let isParsingMainContract = false;
  let isParsingTable = false;
  let isParsingFunctions = false;

  for (const line of lines) {
    // Look for the start of the main contract table
    if (line.includes(`contracts/download-${contractAddress}.sol:${contractName} Contract |`)) {
      isParsingMainContract = !line.includes('Test Contract');
      isParsingTable = isParsingMainContract;
      continue;
    }

    // Stop parsing when we reach the end of the table
    if (isParsingTable && line.startsWith('╰')) {
      isParsingFunctions = false;
      isParsingTable = false;
      isParsingFunctions = false;
      continue;
    }

    // Skip header rows and empty rows
    if (isParsingTable && !line.includes('|')) continue;
    if (isParsingTable && (line.includes('═') || line.includes('Deployment'))) continue;

    // Start recording function names when we hit this line
    if (isParsingTable && line.includes('Function Name')) {
      isParsingFunctions = true;
      continue;
    }

    // Parse function rows
    if (isParsingFunctions && line.includes('|')) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 6) {
        const functionName = parts[1];
        const minGas = parseInt(parts[2].replace(/,/g, ''));

        if (!isNaN(minGas) && functionName !== '') {
          results.push({
            functionName,
            gasUsed: minGas
          });
        }
      }
    }
  }

  return results;
};
