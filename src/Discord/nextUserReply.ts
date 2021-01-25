import { Message, TextChannel } from "discord.js";

const pendingRepliesSet = new Set();
const serialize = (message: Message) => message.author.id + message.channel.id;

export function hasPendingReply(message: Message): boolean {
	return pendingRepliesSet.has(serialize(message));
}

export async function nextUserReply(message: Message): Promise<Message | undefined> {
	const serialized = serialize(message);
	pendingRepliesSet.add(serialized);

	const user = message.author;
	const channel = message.channel as TextChannel;
	const reply = await channel.awaitMessages((newMessage: Message) => newMessage.author.id === user.id, {
		max: 1,
		time: 30000,
	});

	pendingRepliesSet.delete(serialized);
	return reply.first()!;
}
