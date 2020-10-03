import { Community } from "Discord/server";

const server = new Community();

process.on("SIGINT", () => {
	server.destroy();

	process.exit();
});
