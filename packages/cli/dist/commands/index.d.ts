import { CommandDef } from "citty";

declare const commands: {
	readonly update: () => Promise<CommandDef>;
};

export { commands };
