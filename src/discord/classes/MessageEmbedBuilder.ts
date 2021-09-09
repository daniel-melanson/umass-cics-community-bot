import { GuildMember, MessageEmbed, MessageEmbedOptions, User } from "discord.js";

export class MessageEmbedBuilder extends MessageEmbed {
  constructor(data?: MessageEmbedOptions) {
    super(data);

    if (!super.color) {
      super.setColor(8594214);
    }
  }

  setUser(userOrMember: User | GuildMember) {
    const user = "nickname" in userOrMember ? userOrMember.user : userOrMember;
    const avatar = user.avatarURL() || user.defaultAvatarURL;

    let name = user.username;
    if ("nickname" in userOrMember && userOrMember.nickname) {
      name = userOrMember.nickname;
    }

    super.setAuthor(name, avatar);

    return this;
  }
}
