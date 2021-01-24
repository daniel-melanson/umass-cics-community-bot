import fs from "fs";
import path from "path";

import { Command, _Command, UserPermission } from "Discord/commands/types";
import { capitalize } from "Shared/stringUtil";

function error(cmd: Command, reason: string) {
	console.error(`[COMMANDS] Invalid command ${cmd.identifier}: ${reason}`);
	process.exit(-1);
}

const __filename = import.meta.url.replace("file:/", "/");
const __dirname = __filename.substring(0, __filename.lastIndexOf("/") + 1);
const identifierMatch = /^[a-zA-Z][a-zA-Z-]+$/;
export async function requireCommandList(ignore?: string): Promise<Array<Readonly<_Command>>> {
	const commandList = [];

	const reservedIdentifiers = new Set();
	for (const folder of ["admin", "info", "misc", "roles", "utility"]) {
		const groupPath = path.join(__dirname, folder);

		for (const file of fs.readdirSync(groupPath)) {
			if (!file.match(/^[\w\-]+\.js$/) || (ignore && file.match(new RegExp(`^${ignore}\.js$`)))) continue;

			// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
			const cmdModule = await import(path.join(groupPath, file));
			const cmd = cmdModule.default as Command;

			const defaults = [cmd.identifier];
			if (cmd.aliases) defaults.push(...cmd.aliases);

			if (!cmd.identifier.match(identifierMatch))
				error(cmd, "identifier must start with a letter and be proceeded by letters or dashes.");
			if (cmd.formalName && !cmd.formalName.match(/^[a-zA-Z][a-zA-Z\- ]+$/))
				error(cmd, "formalName must start with a letter and be proceeded by letters, spaces, or dashes.");
			if (cmd.aliases && cmd.aliases.some(alias => !alias.match(/^[a-zA-Z]/)))
				error(cmd, "aliases must start with a letter.");

			if (cmd.arguments) {
				if (cmd.arguments.length > 1) {
					for (const arg of cmd.arguments.slice(0, cmd.arguments.length - 1)) {
						if (arg.infinite) {
							error(cmd, "Only the last argument may have the infinite attribute.");
						}

						if (arg.optional) {
							error(cmd, "Only the last argument may have the optional attribute.");
						}
					}
				}

				const lastArg = cmd.arguments[cmd.arguments.length - 1];
				if (lastArg.type === "string" && lastArg.infinite) {
					error(cmd, "Strings are inherently infinite. Remove the infinite attribute.");
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
				defaultPatterns: defaults.map(x =>
					!cmd.arguments || cmd.arguments.length === 0
						? new RegExp(`^!${x}$`, "im")
						: new RegExp(`^!${x}(\\s+(.+)|$)`, "im"),
				),
				patterns: cmd.patterns,
				description: cmd.description,
				details: cmd.details,
				examples: cmd.examples,
				guildOnly: cmd.guildOnly || false,
				userPermission: cmd.userPermission || UserPermission.Member,
				arguments: cmd.arguments,
				func: cmd.func,
			});
		}
	}

	return commandList;
}
