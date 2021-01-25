import { oneLine } from "Shared/stringUtil";

import { formatEmbed } from "Discord/formatting";

export const WELCOME_MESSAGES = [
	formatEmbed({
		title: "A Quote from Marc Liberatore",
		description: oneLine(`*Hello and welcome!
			Welcome to our time of learning together.
			Welcome to the many first years in this classroom, who are attending their first day of college classes today. Welcome to returning students.
			Welcome to people of all ages, all colors, all cultures, abilities, sexual orientations and gender identities.
			Welcome to those who identify as biracial, multi-racial, or multi-ethnic.
			Welcome to people from Massachusetts, from other states, and from countries all around the world.
			Welcome to people of all political persuasions – or who abstain from politics. Welcome to people of all religions and of no religion.
			Welcome to military veterans.
			Welcome to people who live with mental illness.
			Welcome to those of you who are financially broke, or those broken in spirit.
			It is my firm belief that you all belong here, and I want you to feel welcome. Whoever you, wherever you are on your journey in computer science, you are welcome here.*`),
		timestamp: false,
	}),
	formatEmbed({
		title:
			"Welcome to the University of Massachusetts College of Information and Computer Sciences Community Discord Server!",
		description: oneLine(`Welcome to a community of over one thousand UMass CICS prospects, students, alumni, and Professors.
			This community was made for members to discuss course material, seek career advice, or show off their most recent projects.
			**To help foster this community, we ask all of our members to associate themselves with a real-life name.**
			**A real-life name could be anything from a pet name, nickname, or even just an initial.**
			To get started, follow the instruction based on your device below:`),
		fields: [
			{
				name: "*Desktop*",
				value:
					"Click on `UMass CICS Community` in bold in the top left of your screen. Press `Change Nickname`, enter your identifier, and `Save`.",
				inline: true,
			},
			{
				name: "*Mobile*",
				value: oneLine(`Swipe to the right to display your sever list.
					Press the three vertically aligned dots next to \`UMass CICS Community\`.
					Press \`Change Nickname\`, enter your identifier, and \`Save\`.`),
				inline: true,
			},
			{
				name: "**Next Steps**",
				value: oneLine(`**Once you are done setting your nickname, please type \`verify\` in the welcome channel.**
					This tells the bot that you are ready to enter the server. Keep in mind that we track the users that verify.
					If you have an unfavorable name, you are subject to moderation. Once you verify, the bot will be waiting for you in the #bot-commands channel for next steps. Enjoy!
				`),
			},
			{
				name: "**Note to Professors**",
				value: oneLine(`You are absolutely welcome to join this community;
					however, it is primarily made up of students.
					Discussion has been kept civil, but community members may have expressed strong opinions towards you.
				`),
			},
		],
		timestamp: false,
	}),
];
