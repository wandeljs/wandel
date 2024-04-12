import {
	SchematicTestRunner,
	UnitTestTree,
} from "@angular-devkit/schematics/testing";
import { virtualFs } from "@angular-devkit/core";
import { HostTree } from "@angular-devkit/schematics";

describe("@schematics/update", () => {
	const schematicRunner = new SchematicTestRunner(
		"@schematics/update",
		require.resolve("./collection.json"),
	);
	// let host: virtualFs.test.TestHost;
	// let appTree: UnitTestTree = new UnitTestTree(new HostTree());

	beforeEach(() => {
		// host = new virtualFs.test.TestHost({
		// 	"/package.json": `{
		//     "name": "blah",
		//     "dependencies": {
		//       "@angular-devkit-tests/update-base": "1.0.0"
		//     }
		//   }`,
		// });
		// appTree = new UnitTestTree(new HostTree(host));
	});

	it("ignores dependencies not hosted on the NPM registry", async () => {
		let newTree = new UnitTestTree(
			new HostTree(
				new virtualFs.test.TestHost({
					"/package.json": `{
        "name": "blah",
        "dependencies": {
          "@angular-devkit-tests/update-base": "file:update-base-1.0.0.tgz"
        }
      }`,
				}),
			),
		);

		newTree = await schematicRunner.runSchematic("update", undefined, newTree);
		const packageJson = JSON.parse(newTree.readContent("/package.json"));
		expect(
			packageJson["dependencies"]["@angular-devkit-tests/update-base"],
		).toBe("file:update-base-1.0.0.tgz");
	}, 45000);
});
