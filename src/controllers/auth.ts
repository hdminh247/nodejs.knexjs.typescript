import { Request, Response, NextFunction } from "express";

// Utils
import encryptionUtils from "../utils/encryption";
import HttpResponse from "../services/response";
import jwtUtils from "../utils/jwt";

// Models
import User from "../models/user";

/**
 * @swagger
 * definitions:
 *   Login:
 *     required:
 *       - email
 *       - password
 *     properties:
 *       email:
 *         type: string
 *       password:
 *         type: string
 */

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     description: Login API
 *     tags: [Auth]
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body
 *         schema:
 *           $ref: '#definitions/Login'
 *           type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid request params
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resource not found
 */

export const signIn = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { body } = req;

    const user = await User.query().findOne({ email: body.email });

    if (!user) {
      return HttpResponse.returnBadRequestResponse(res, "auth.fail");
    }
    const passwordMatch = encryptionUtils.checkPassword(body.password, user.password);
    if (!passwordMatch) return HttpResponse.returnBadRequestResponse(res, "auth.fail");

    // @ts-ignore
    delete user["password"];

    const token = jwtUtils.generate({
      ...user,
    });

    return HttpResponse.returnSuccessResponse(res, { token, user });
  } catch (err: any) {
    next(err);
  }
};
