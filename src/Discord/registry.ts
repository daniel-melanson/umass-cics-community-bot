import fs from "fs";
import path from "path";

import { Command, _Command, UserPermission } from "Discord/commands/types";
import { capitalize } from "./formatting";

function error(cmd: Command, reason: string) {
	console.error(`[REGISTRY] Invalid command ${cmd.identifier}: ${reason}`);
	process.exit(-1);
}

const commandList = new Array<Readonly<_Command>>();
const identifierMatch = /^[a-zA-Z\-]+$/;
export function registerCommands(): void {
	const basePath = path.join(__dirname, "commands");

	const reservedIdentifiers = new Set();
	for (const folder in ["admin", "info", "misc"]) {
		const groupPath = path.join(basePath, folder);

		for (const file in fs.readdirSync(groupPath)) {
			if (!file.match(/\.js$/)) continue;

			// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
			const cmd = require(path.join(groupPath, file)) as Command;

			const defaults = [cmd.identifier];
			if (cmd.aliases) defaults.push(...cmd.aliases);

			if (!cmd.identifier.match(identifierMatch))
				error(cmd, "identifier can only contain only contain alphabetic letters and dashes.");
			if (cmd.formalName && !cmd.formalName.match(/^[a-zA-Z\- ]+$/))
				error(cmd, "formalName can only contain only contain alphabetic letters, spaces and dashes.");
			if (cmd.aliases && cmd.aliases.some(alias => !alias.match(identifierMatch)))
				error(cmd, "aliases can only contain only contain alphabetic letters and dashes.");

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
				defaultPatterns: defaults.map(x => new RegExp(`/^!${x}/mi`)),
				patterns: cmd.patterns,
				description: cmd.description,
				details: cmd.details,
				examples: cmd.examples,
				clientPermissions: cmd.clientPermissions,
				userPermission: cmd.userPermission || UserPermission.Member,
				arguments: cmd.arguments,
				func: cmd.func,
			});
		}
	}
}
