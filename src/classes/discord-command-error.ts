export default class DiscordCommandError {
  constructor(
    public readonly userMessage: string,
    public readonly internalMessage?: string,
    public readonly error?: unknown,
  ) {}
}
