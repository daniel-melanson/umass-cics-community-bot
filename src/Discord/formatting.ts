import {
	ColorResolvable,
	EmbedFieldData,
	FileOptions,
	MessageAttachment,
	User,
	MessageEmbedOptions,
	MessageEmbedFooter,
	MessageEmbedImage,
	MessageEmbedThumbnail,
	MessageEmbedVideo,
	MessageEmbed,
} from "discord.js";

import { UMASS_MAROON, ICON_URL } from "Shared/constants";

interface EmbedOptions {
	title?: string;
	description?: string;
	url?: string;
	timestamp?: boolean;
	color?: ColorResolvable;
	fields?: Array<EmbedFieldData>;
	files?: Array<MessageAttachment | string | FileOptions>;
	author?: User | boolean;
	thumbnail?: Partial<MessageEmbedThumbnail> & { proxy_url?: string };
	image?: Partial<MessageEmbedImage> & { proxy_url?: string };
	video?: Partial<MessageEmbedVideo> & { proxy_url?: string };
	footer?: Partial<MessageEmbedFooter> & { icon_url?: string; proxy_icon_url?: string };
}

export function formatEmbed(opts: EmbedOptions): MessageEmbed {
	const generated: MessageEmbedOptions = {
		title: opts.title,
		description: opts.description,
		timestamp: opts.timestamp !== false ? new Date() : undefined,
		color: UMASS_MAROON,
		fields: opts.fields,
		footer: opts.footer,
	};

	if (opts.author === true) {
		generated.author = {
			name: "UMass CICS Community",
			iconURL: ICON_URL,
		};
	} else if (opts.author instanceof User) {
		generated.author = {
			name: opts.author.tag,
			iconURL: opts.author.avatarURL({ dynamic: true }) || undefined,
		};
	}

	return new MessageEmbed(generated);
}

export function capitalize(str: string): string {
	return str[0].toUpperCase() + str.substring(1);
}