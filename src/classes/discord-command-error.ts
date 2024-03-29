export default class DiscordCommandError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly internalMessage?: string,
  ) {
    super();
  }
}
