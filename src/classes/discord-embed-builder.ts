import { EmbedBuilder, GuildMember, User } from "discord.js";

export class DiscordEmbedBuilder extends EmbedBuilder {
  constructor() {
    super();

    super.setColor("#881c1c");
  }

  setUser(user: User | GuildMember) {
    user = "nickname" in user ? user.user : user;
    const avatar = user.avatarURL() || user.defaultAvatarURL;

    super.setAuthor({
      name: user.tag,
      iconURL: avatar,
    });

    return this;
  }
}
