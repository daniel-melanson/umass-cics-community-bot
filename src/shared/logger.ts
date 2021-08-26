type Scope = "MAIN" | "UMASS" | "COMMAND" | "DISCORD";

export function error(scope: Scope, msg: string, ...dump: Array<unknown>): void {
  console.error(`ERROR[${scope}] ${msg}.\n${dump.join("-".repeat(process.stdout.columns))}`);
  process.exit(-1);
}

export function log(scope: Scope, msg: string): void {
  console.log(`LOG[${scope}] ` + msg);
}
