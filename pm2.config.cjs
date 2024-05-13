module.exports = {
  name: "bot",
  script: "./src/index.ts",
  interpreter: "bun",
  cron_restart: "0 0 * * *",
};
