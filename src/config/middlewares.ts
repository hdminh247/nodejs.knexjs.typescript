import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import winston from "winston";
import morgan from "morgan";

export default function middlewares(app: any) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(cors());

  const isInLambda = !!process.env.LAMBDA_TASK_ROOT;

  if (!isInLambda) {
    // Log requests
    app.use(
      morgan("tiny", {
        stream: { write: (message: any) => winston.info(message.trim()) },
        skip: (req) => req["baseUrl"] === "/ping",
      }),
    );
  }
}
