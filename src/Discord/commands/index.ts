import fs from "fs";
import path from "path";

import { Command, _Command, UserPermission } from "Discord/commands/types";
import { capitalize } from "Discord/formatting";

function error(cmd: Command, reason: string) {
	console.error(`[COMMANDS] Invalid command ${cmd.identifier}: ${reason}`);
	process.exit(-1);
}

const identifierMatch = /^[a-zA-Z][a-zA-Z-]+$/;
export function requireCommandList(ignore?: string): Array<Readonly<_Command>> {
	const commandList = [];

	const reservedIdentifiers = new Set();
	for (const folder of ["admin", "info", "misc", "roles"]) {
		const groupPath = path.join(__dirname, folder);

		for (const file of fs.readdirSync(groupPath)) {
			if (!file.match(/^\.js$/) || (ignore && file.match(new RegExp(`^${ignore}\.js$`)))) continue;

			// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
			const cmd = require(path.join(groupPath, file)) as Command;

			const defaults = [cmd.identifier];
			if (cmd.aliases) defaults.push(...cmd.aliases);

			if (!cmd.identifier.match(identifierMatch))
				error(cmd, "identifier must start with a letter and be proceeded by letters or dashes.");
			if (cmd.formalName && !cmd.formalName.match(/^[a-zA-Z][a-zA-Z\- ]+$/))
				error(cmd, "formalName must start with a letter and be proceeded by letters, spaces, or dashes.");
			if (cmd.aliases && cmd.aliases.some(alias => !alias.match(identifierMatch)))
				error(cmd, "aliases must start with a letter and be proceeded by letters or dashes.");

			if (cmd.arguments && cmd.arguments.length > 1) {
				for (const arg of cmd.arguments.slice(0, cmd.arguments.length - 1)) {
					if (arg.infinite) {
						error(cmd, "Only the last argument may have the infinite attribute.");
					}
				}
			}

			if (reservedIdentifiers.has(cmd.identifier)) error(cmd, `identifier '${cmd.identifier}' is already taken.`);
			reservedIdentifiers.add(cmd.identifier);

			if (cmd.formalName) {
				if (reservedIdentifiers.has(cmd.formalName))
					error(cmd, `formalName '${cmd.formalName}' is already taken.`);

				reservedIdentifiers.add(cmd.formalName);
			}

			if (cmd.aliases) {
				cmd.aliases.forEach(alias => {
					if (reservedIdentifiers.has(alias)) error(cmd, `alias '${alias}' is already taken.`);

					reservedIdentifiers.add(alias);
				});
			}

			commandList.push({
				identifier: cmd.identifier,
				formalName: cmd.formalName || capitalize(cmd.identifier),
				group: cmd.group,
				aliases: cmd.aliases,
				defaultPatterns: defaults.map(x => new RegExp(`/^!${x}\s*(.*)/mi`)),
				patterns: cmd.patterns,
				description: cmd.description,
				details: cmd.details,
				examples: cmd.examples,
				guildOnly: cmd.guildOnly || false,
				clientPermissions: cmd.clientPermissions,
				userPermission: cmd.userPermission || UserPermission.Member,
				arguments: cmd.arguments,
				func: cmd.func,
			});
		}
	}

	return commandList;
}
