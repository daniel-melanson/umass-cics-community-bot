export class CommandError extends Error {
  constructor(public readonly userMessage: string, public readonly internalMessage?: string) {
    super();
  }
}
