import assert from "assert";

export function assertIsError(
	value: unknown,
): asserts value is Error & { code?: string } {
	const isError =
		value instanceof Error ||
		// The following is needing to identify errors coming from RxJs.
		(typeof value === "object" &&
			value &&
			"name" in value &&
			"message" in value);
	assert(isError, "catch clause variable is not an Error instance");
}
