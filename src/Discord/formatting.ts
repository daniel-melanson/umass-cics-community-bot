import {
	ColorResolvable,
	EmbedFieldData,
	FileOptions,
	MessageAttachment,
	User,
	MessageEmbedOptions,
	MessageEmbedFooter,
	MessageEmbedAuthor,
	MessageEmbedThumbnail,
	MessageEmbedVideo,
	MessageEmbed,
} from "discord.js";

import { UMASS_MAROON } from "Discord/constants";

interface EmbedOptions {
	title?: string;
	description?: string;
	url?: string;
	timestamp?: boolean;
	color?: ColorResolvable;
	fields?: Array<EmbedFieldData>;
	files?: Array<MessageAttachment | string | FileOptions>;
	author?: User | MessageEmbedAuthor;
	thumbnail?: Partial<MessageEmbedThumbnail> & { proxy_url?: string };
	image?: string;
	video?: Partial<MessageEmbedVideo> & { proxy_url?: string };
	footer?: Partial<MessageEmbedFooter> & { icon_url?: string; proxy_icon_url?: string };
}

export function formatEmbed(opts: EmbedOptions): MessageEmbed {
	const generated: MessageEmbedOptions = {
		title: opts.title,
		url: opts.url,
		description: opts.description,
		timestamp: opts.timestamp !== false ? new Date() : undefined,
		color: opts.color || UMASS_MAROON,
		image: {
			url: opts.image,
		},
		fields: opts.fields,
		footer: opts.footer,
	};

	const author = opts.author;
	if (author instanceof User) {
		generated.author = {
			name: author.tag,
			iconURL: author.avatarURL({ dynamic: true }) || undefined,
		};
	} else if (author) {
		generated.author = author;
	}

	return new MessageEmbed(generated);
}
