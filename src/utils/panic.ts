import { logger } from "./logger";

export function panic(message: string, error?: unknown): never {
  if (error) logger.fatal("%s: %o", message, error);
  else logger.fatal(message);

  process.exit(1);
}
