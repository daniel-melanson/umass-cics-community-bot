import { GuildMember, MessageEmbed, MessageEmbedOptions, User } from "discord.js";
import { UMASS_MAROON } from "../constants";

export class MessageEmbedBuilder extends MessageEmbed {
  constructor(data?: MessageEmbedOptions) {
    super(data);

    if (!super.color) {
      super.setColor(UMASS_MAROON);
    }
  }

  setUser(userOrMember: User | GuildMember) {
    const user = "nickname" in userOrMember ? userOrMember.user : userOrMember;
    const avatar = user.avatar || user.defaultAvatarURL;

    let name = user.username;
    if ("nickname" in userOrMember && userOrMember.nickname) {
      name = userOrMember.nickname;
    }

    super.setAuthor(name, avatar);

    return this;
  }
}
