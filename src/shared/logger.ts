type Scope = "MAIN" | "UMASS" | "DISCORD" | string;

function now() {
  return new Date().toLocaleString() + " - ";
}

export function error(scope: Scope, msg: string, ...dump: Array<unknown>): void {
  console.error(now() + `ERROR[${scope}] ${msg}.\n${dump.join("-".repeat(process.stdout.columns) + "\n")}`);
  process.exit(-1);
}

export function log(scope: Scope, msg: string): void {
  console.log(now() + `LOG[${scope}] ` + msg);
}

export function warn(scope: Scope, msg: string, ...dump: Array<unknown>): void {
  console.warn(now() + `WARN[${scope}] ${msg}.\n${dump.join("-".repeat(process.stdout.columns) + "\n")}`);
}
