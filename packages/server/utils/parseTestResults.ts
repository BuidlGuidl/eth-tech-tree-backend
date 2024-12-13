import { IGasReport } from "../mongodb/models/user";

interface TestResult {
    name: string;
    gas: number;
    reason?: string;
  }
  
  interface ParsedResults {
    passed: boolean;
    passingTests: Record<string, TestResult>;
    failingTests: Record<string, TestResult>;
    gasReport: IGasReport[];
    error?: string;
  }
  
  export const parseTestResults = (output: string): ParsedResults => {
    const results: ParsedResults = {
      passed: false,
      passingTests: {},
      failingTests: {},
      gasReport: [],
    };
    const gasUsage: { [key: string]: number } = {};
  
    // Split the output into individual lines
    const lines = output.split('\n');
  
    // Iterate through the lines and parse the relevant information
    for (const line of lines) {
      // Check for passing tests
      const passingTestMatch = line.match(/\[PASS\] (\w+)\(\) \(gas: (\d+)\)/);
      if (passingTestMatch) {
        const [, testName, gas] = passingTestMatch;
        const testResult: TestResult = { name: testName, gas: parseInt(gas) };
        results.passingTests[testName] = testResult;
        gasUsage[testName] = testResult.gas;
      }
  
      // Check for failing tests
      const failingTestMatch = line.match(/\[FAIL\. Reason: (.*)\] (\w+)\(\) \(gas: (\d+)\)/);
      if (failingTestMatch) {
        const [, reason, testName, gas] = failingTestMatch;
        const testResult: TestResult = { name: testName, reason, gas: parseInt(gas) };
        results.failingTests[testName] = testResult;
        gasUsage[testName] = testResult.gas;
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
      // Process gas usage for each test
      for (const testName in gasUsage) {
        results.gasReport.push({ functionName: testName, gasUsed: gasUsage[testName] });
      }
    }
    return results;
  };