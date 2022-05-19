import * as core from "express-serve-static-core";
import express from "express";

// Routes
import authRouter from "./auth";
import userRouter from "./user";

// Middlewares
import errorMiddlewares from "./middlewares/error";
import staticPathMiddlewares from "./middlewares/static-path";
import databaseMiddlewares from "./middlewares/database";

const baseApi = express.Router();

export default function routes(app: core.Express) {
  databaseMiddlewares(app);

  baseApi.use("/auth", authRouter);
  baseApi.use("/user", userRouter);

  app.use("/api/v1", baseApi);

  // To serve static files
  staticPathMiddlewares(app);

  // Error handlers
  errorMiddlewares(app);
}
