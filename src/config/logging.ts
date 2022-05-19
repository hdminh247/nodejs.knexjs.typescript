import winston from "winston";
// const { combine, timestamp, printf } = winston.format;

// @ts-ignore
winston.error = (err) => {
  if (err instanceof Error) {
    winston.log({ level: "error", message: `${err.stack || err}` });
  } else {
    winston.log({ level: "error", message: err });
  }
};

// const prodFormat = printf((info) => {
//   return `${info.timestamp} ${info.level}: ${info.message}`;
// });
//
// const levels = {
//   error: 0,
//   warn: 1,
//   info: 2,
//   verbose: 3,
//   debug: 4,
//   silly: 5,
// };

export default function logging() {
  if (process.env.NODE_ENV === "production") {
    winston.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    );

    // I commented this because on aws prod, we maybe implement log service already
    // winston.configure({
    //   levels: levels,
    //   format: combine(timestamp(), prodFormat),
    //   transports: [
    //     //
    //     // - Write to all logs with level `info` and below to `combined.log`
    //     // - Write all logs error (and below) to `error.log`.
    //     //
    //     new winston.transports.File({ filename: process.env.LOG_PATH + "/error.log", level: "error" }),
    //     new winston.transports.File({ filename: process.env.LOG_PATH + "/combined.log" }),
    //   ],
    //   exceptionHandlers: [
    //     new winston.transports.File({
    //       filename: process.env.LOG_PATH + "/exceptions.log",
    //       maxsize: 1000000,
    //     }),
    //   ],
    //   exitOnError: false, // <--- set this to false
    // });
  } else {
    winston.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    );
  }
}
