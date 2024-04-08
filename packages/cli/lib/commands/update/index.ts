import { defineCommand } from "citty";

export default defineCommand({
	meta: {
		name: "update",
		description: "Update Dependencies and run migrations if possible",
	},
	args: {},
});
