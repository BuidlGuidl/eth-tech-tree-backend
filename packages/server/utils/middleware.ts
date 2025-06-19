import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { ALLOWED_NETWORKS } from ".";
import { fetchChallengeNames } from "../services/challenge";

const ischallengeName = async (challengeName: string) => {
  const challengeNames = await fetchChallengeNames();
  return challengeNames.includes(challengeName);
};

/**
 * Validations for the params of the challenge submission route
 */
export const validateChallengeSubmission = [
  body("challengeName").custom(async slug => {
    if (!await ischallengeName(slug)) {
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

export const validateNewUser = [
  body("address").optional({ nullable: true }).isEthereumAddress().withMessage("Invalid Ethereum address"),
  body("ens").optional({ nullable: true }).isString().withMessage("Invalid ENS name"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
]

export const validateIdentifier = [
  param("identifier").isString().withMessage("Invalid Ethereum address or ENS name"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
]
