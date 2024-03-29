import pino from "pino";
import { $ } from "bun";

$`mkdir -p logs/`;

const transport =
  process.env.NODE_ENV === "PRODUCTION"
    ? pino.transport({
        target: "pino/file",
        options: { destination: "logs/app.log" },
      })
    : pino.transport({ target: "pino-pretty", options: { destination: 1 } });

export const logger = pino(transport);
