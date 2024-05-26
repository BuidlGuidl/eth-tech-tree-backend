export type Challenge = {
  id: number;
  type: string;
  level: number;
  name: string;
  label: string;
  github: string;
  testHash: string;
  contractName: string;
  testFileName: string;
  tags: string[];
};
