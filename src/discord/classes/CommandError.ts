export class CommandError extends Error {
  constructor(public readonly userMessage: string, internalMessage?: string) {
    super(internalMessage);
  }
}
