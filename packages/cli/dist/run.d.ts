declare const runMain: () => Promise<void>;
declare function runCommand(
	name: string,
	argv?: string[],
	data?: {
		overrides?: Record<string, unknown>;
	},
): Promise<{
	result: unknown;
}>;

export { runCommand, runMain };
