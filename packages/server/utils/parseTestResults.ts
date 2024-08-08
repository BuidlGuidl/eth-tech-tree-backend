interface TestResult {
    name: string;
    gas: number;
    reason?: string;
  }
  
  interface ParsedResults {
    passed: boolean;
    passingTests: Record<string, TestResult>;
    failingTests: Record<string, TestResult>;
    gasUsage: Record<string, number>;
  }
  
  export const parseTestResults = (output: string): ParsedResults => {
    const results: ParsedResults = {
      passed: false,
      passingTests: {},
      failingTests: {},
      gasUsage: {},
    };
  
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
        results.gasUsage[testName] = testResult.gas;
      }
  
      // Check for failing tests
      const failingTestMatch = line.match(/\[FAIL\. Reason: (.*)\] (\w+)\(\) \(gas: (\d+)\)/);
      if (failingTestMatch) {
        const [, reason, testName, gas] = failingTestMatch;
        const testResult: TestResult = { name: testName, reason, gas: parseInt(gas) };
        results.failingTests[testName] = testResult;
        results.gasUsage[testName] = testResult.gas;
      }
    }
  
    if (Object.keys(results.failingTests).length === 0) {
      results.passed = true;
    }
    return results;
  };