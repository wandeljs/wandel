// lib/utils/engines.ts
async function checkEngines() {
	const satisfies = await import("./satisfies-KJLM2TCG.js").then(
		(r) => r.default || r,
	);
	const currentNode = process.versions.node;
	const nodeRange = ">= 18.0.0";
	if (!satisfies(currentNode, nodeRange)) {
		console.warn(
			`Current version of Node.js (\`${currentNode}\`) is unsupported and might cause issues.
       Please upgrade to a compatible version \`${nodeRange}\`.`,
		);
	}
}

export { checkEngines };
//# sourceMappingURL=chunk-YRJDRM4T.js.map
