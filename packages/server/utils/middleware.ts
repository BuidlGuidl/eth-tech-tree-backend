import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { ALLOWED_NETWORKS } from ".";
import { fetchChallengeNames } from "../services/challenge";

const isChallengeSlug = async (challengeSlug: string) => {
  const challengeNames = await fetchChallengeNames();
  return challengeNames.includes(challengeSlug);
};

/**
 * Validations for the params of the challenge submission route
 */
export const validateChallengeSubmission = [
  body("challengeSlug").custom(async slug => {
    if (!await isChallengeSlug(slug)) {
      throw new Error(`Challenge "${slug}" not found.`);
    }
  }),
  body("network").isIn(ALLOWED_NETWORKS).withMessage("Invalid network name"),
  body("contractAddress").isEthereumAddress().withMessage("Invalid Ethereum contract address"),
  body("userAddress").isEthereumAddress().withMessage("Invalid Ethereum user address"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateAddress = [
  param("address").isEthereumAddress().withMessage("Invalid Ethereum address"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
]
