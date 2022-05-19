import * as jwt from "jsonwebtoken";

const utils = {
  generate: (content: any, options = {}) => jwt.sign(content, process.env.APP_SECRET as string, options),
  verify: (token: string) => jwt.verify(token, process.env.APP_SECRET as string),
};

export default utils;
