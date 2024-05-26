import { param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { allowedNetworks } from ".";

export const validateSubmission = [
  param("challengeId").isInt().withMessage("Challenge ID must be an integer"),
  param("network").isIn(allowedNetworks).withMessage("Invalid network name"),
  param("address").isEthereumAddress().withMessage("Invalid Ethereum address"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
