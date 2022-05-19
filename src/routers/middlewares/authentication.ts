import { NextFunction, Request, Response } from "express";

import jwtUtils from "../../utils/jwt";
import HttpResponse from "../../services/response";

import User from "../../models/user";

export const verifyToken = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (token) {
      try {
        const verifiedInfo: any = jwtUtils.verify(token.split(" ")[1]);

        // Get user info
        req["user"] = await User.query()
          .findOne({ ddqcUserKey: verifiedInfo.ddqcUserKey })
          .withGraphFetched("[role, userAvatar]")
          .skipUndefined();
        await next();
      } catch (err: any) {
        console.log(err);
        return HttpResponse.returnUnAuthorizeResponse(res, "auth.token.invalid");
      }
    } else {
      return HttpResponse.returnUnAuthorizeResponse(res, "auth.token.invalid");
    }
  };
};

export const isAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req["user"]) {
      if (req["user"].role.name !== "Admin") {
        return HttpResponse.returnUnAuthorizeResponse(res, "auth.token.invalid");
      } else {
        next();
      }
    } else {
      return HttpResponse.returnUnAuthorizeResponse(res, "auth.token.invalid");
    }
  };
};
