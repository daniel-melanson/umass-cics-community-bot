import { MessageOptions } from "child_process";
import { InteractionReplyOptions, Message, MessageEditOptions, MessagePayload, TextBasedChannels, User } from "discord.js";

export type OptionMatchGroups = Record<string, number>;

export class PatternInteraction {
  private replyMessage?: Message;

  public user: User;
  public channel: TextBasedChannels;
  constructor(
    private readonly message: Message,
    private readonly match: RegExpMatchArray,
    private readonly groups: OptionMatchGroups,
  ) {
    this.user = this.message.author;
    this.channel = this.message.channel;
  }

  get replied() {
    return this.replyMessage !== undefined;
  }

  get options() {
    return {
      getString: (name: string, required: boolean) => {
        const value = this.groups[name];
        if (!value && required) throw new Error(`PatternInteraction expected option ${name}.`);

        return this.match[value];
      },
    };
  }

  public deleteReply() {
    if (!this.replyMessage) throw new Error("PatternInteraction has not been replied to yet.");

    this.replyMessage.delete();
  }

  public editReply(options: string | MessagePayload | MessageEditOptions): Promise<Message> {
    if (!this.replyMessage) throw new Error("PatternInteraction has not been replied to yet.");

    return this.replyMessage.edit(options);
  }

  public fetchReply() {
    return Promise.resolve(this.message);
  }

  public followUp(options: string | MessagePayload | InteractionReplyOptions): Promise<Message> {
    if (!this.replyMessage) throw new Error("PatternInteraction has not been replied to yet.");

    return this.replyMessage.reply(options);
  }

  public async reply(options: string | MessagePayload | InteractionReplyOptions): Promise<void> {
    await this.message.reply(options);
  }
}
