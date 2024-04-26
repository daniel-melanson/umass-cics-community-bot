import pino from "pino";
import { $ } from "bun";

const transport = pino.transport({
  target: "pino-pretty",
  options: {
    destination: 1,
    level: process.env.NODE_ENV === "production" ? "info" : "trace",
  },
});

export const logger = pino(transport);
