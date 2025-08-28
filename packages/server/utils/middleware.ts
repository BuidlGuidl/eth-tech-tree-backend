import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { verifyMessage } from "viem";
import { fetchChallengeNames } from "../services/challenge";
import { AUTH_MESSAGE } from "./constants";

const ischallengeName = async (challengeName: string) => {
  const challengeNames = await fetchChallengeNames();
  return challengeNames.includes(challengeName);
};

const validateSignature = async (req: Request, res: Response, next: NextFunction) => {
  const { userAddress, signature } = req.body;

  try {
    const authMessage = AUTH_MESSAGE;

    const isValid = await verifyMessage({
      address: userAddress as `0x${string}`,
      message: authMessage,
      signature: signature as `0x${string}`
    });

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

  } catch (error) {
    console.error("Signature verification error:", error);
    return res.status(401).json({ error: "Signature verification failed" });
  }
  next();
}

/**
 * Validations for the params of the challenge submission route
 */
export const validateChallengeSubmission = [
  body("challengeName").custom(async slug => {
    if (!await ischallengeName(slug)) {
      throw new Error(`Challenge "${slug}" not found.`);
    }
  }),
  body("contractAddress").isEthereumAddress().withMessage("Invalid Ethereum contract address"),
  body("userAddress").isEthereumAddress().withMessage("Invalid Ethereum user address"),
  body("signature").isString().withMessage("Signature is required"),
  validateSignature,
  // No network validation: the backend will discover the correct network/chainId
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
