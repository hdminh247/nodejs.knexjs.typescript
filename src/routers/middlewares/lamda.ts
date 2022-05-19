import * as core from "express-serve-static-core";
import { LambdaActions } from "lambda-actions";

import { getCurrentInvoke } from "@vendia/serverless-express";

export default function lamdaMiddlewares(app: core.Express) {
  app.use(async function (req, res, next) {
    console.log(`lamda here`);
    const { event } = getCurrentInvoke();

    if (!event.requestContext) {
      next();
    }

    try {
      const connectionId = event.requestContext.connectionId;
      const routeKey = event.requestContext.routeKey;
      const body = JSON.parse(event.body || "{}");

      console.log(`Router key: ${routeKey}`);

      const lambdaActions = new LambdaActions();
      lambdaActions.action("$connect", () => {
        console.log(`Connected event in lamda`);
      });
      // lambdaActions.action('$disconnect', $disconnect);
      // lambdaActions.action('setName', setName);
      // lambdaActions.action('sendPublic', sendPublic);
      // lambdaActions.action('sendPrivate', sendPrivate);

      await lambdaActions.fire({
        action: routeKey,
        payload: body,
        meta: { connectionId },
      });

      next();
    } catch (err) {
      console.error(err);

      next();
    }
  });
}
