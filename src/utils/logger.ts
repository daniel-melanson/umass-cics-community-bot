import pino from "pino";

const transport = pino.transport({
  target: "pino-pretty",
  options: {
    destination: 1,
  },
});

export const logger = pino(
  { level: process.env.NODE_ENV === "production" ? "info" : "trace" },
  transport,
);
