import { oneLine } from "common-tags";

import { formatEmbed } from "Discord/formatting";

export const NOTIFICATION_TUTORIALS = [
	formatEmbed({
		title: "Discord Makes a Beeping Sound When A New Message Is Sent",
		description: oneLine(`This is because you have message sounds turned on.
		They are turned on by default and will produce a sound when a message is sent anywhere.
		This tutorial will show you how to disable these sounds.`),
		fields: [
			{
				name: "Desktop",
				value: `Navigate to your notification settings. Find the section labeled sounds. Disable "Message" sounds.`,
				inline: true,
			},
			{
				name: "Mobile",
				value: "Message sounds are not supported on mobile.",
				inline: true,
			},
		],
		author: true,
	}),
	formatEmbed({
		title: "There Is An Unread Badge Next To A Channel I Do Not Read",
		description: oneLine(`One option is to right click (long press on Mobile) the channel and press "Mark As Read".
		This is a temporary solution. To permanently fix this problem you can mute the channel.
		If you want to mute an entire category, you can press/click the category name instead of the channel.`),
		fields: [
			{
				name: "Desktop",
				value: `Right click the channel that you would like to mute and hover over "Mute Channel". Select the option that says "Until I turn it back on".`,
				inline: true,
			},
			{
				name: "Mobile",
				value: `Press and hold the channel that you would like to mute. Press "Mute <channel-name>". Press "Until I turn it back on".`,
				inline: true,
			},
		],
		author: false,
		timestamp: false,
	}),
	formatEmbed({
		title: "There Are Channels I Do Not Want To See",
		description: oneLine(`This can be solved by muting the channel and collapsing category.
		After doing this, the category will only show channels with new messages.`),
		fields: [
			{
				name: "Desktop",
				value: "Mute the channel that you do not wish to see. Left click the category of the channel.",
				inline: true,
			},
			{
				name: "Mobile",
				value: "Mute the channel that you do not wish to see. Tap the category of the channel.",
				inline: true,
			},
		],
		author: false,
		timestamp: false,
	}),
	formatEmbed({
		title: "There Is An Unread Badge Next To The Server Icon",
		description: oneLine(`Similar to channels, you can mark the server as read.
		Permanently this can be solved by muting the entire server.`),
		fields: [
			{
				name: "Desktop",
				value: `Right click the server icon and hover over "Mute Server". Select the option that says "Until I turn back on".`,
				inline: true,
			},
			{
				name: "Mobile",
				value: `Press and hold the server icon. Press "Notifications". Press "Mute UMass CICS Community". Select the option that says "Until I turn back on".`,
				inline: true,
			},
		],
		author: false,
		timestamp: true,
	}),
];
