import * as core from "express-serve-static-core";
import { checkAvailableConnection } from "../../utils/query";
import database from "../../config/database";

export default function databaseMiddlewares(app: core.Express) {
  // Check if connection is not available, do initialize
  app.use(async function (req, res, next) {
    const connectionAvailable = await checkAvailableConnection();

    if (!connectionAvailable) {
      // Initialize database
      await database.init();
    }

    next();
  });
}
