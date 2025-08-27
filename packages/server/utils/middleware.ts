import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { verifyMessage } from "viem";
import { ALLOWED_NETWORKS } from ".";
import { fetchChallengeNames } from "../services/challenge";
import { createAuthMessage } from "./auth";
import { fetchUser } from "../services/user";
import User from "../mongodb/models/user";

const ischallengeName = async (challengeName: string) => {
  const challengeNames = await fetchChallengeNames();
  return challengeNames.includes(challengeName);
};

const validateSignature = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { userAddress, signature } = req.body;

  try {
    const user = await fetchUser(userAddress);
    if (!user || !user.address) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentNonce = user.nonce || 1;
    const authMessage = createAuthMessage(currentNonce);

    const isValid = await verifyMessage({
      address: userAddress as `0x${string}`,
      message: authMessage,
      signature: signature as `0x${string}`
    });

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    await User.updateOne({ address: userAddress }, { $inc: { nonce: 1 } });
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
