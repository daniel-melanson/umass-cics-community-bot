import { config } from "dotenv";

import { initialize } from "#discord/server";
import { error, log } from "#shared/logger";

config();

initialize().then(
  client => {
    log("MAIN", "Interactions registered and client ready.");

    process.on("SIGINT", () => {
      client.destroy();
      process.exit();
    });
  },
  rej => {
    error("MAIN", "Unable to initialize server", rej);
  },
);
