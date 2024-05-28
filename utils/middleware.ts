import { param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { ALLOWED_NETWORKS } from ".";

/**
 * Validations for the params of the challenge submission route
 */
export const validateSubmission = [
  param("challengeId").isInt().withMessage("Challenge ID must be an integer"),
  param("network").isIn(ALLOWED_NETWORKS).withMessage("Invalid network name"),
  param("address").isEthereumAddress().withMessage("Invalid Ethereum address"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
