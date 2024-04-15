import {
  SchematicTestRunner,
  UnitTestTree,
  virtualFs,
  HostTree,
} from '@wandeljs/core';

describe('@schematics/update', () => {
  const schematicRunner = new SchematicTestRunner(
    '@schematics/update',
    require.resolve('./collection.json')
  );

  it('ignores dependencies not hosted on the NPM registry', async () => {
    let newTree = new UnitTestTree(
      new HostTree(
        new virtualFs.test.TestHost({
          '/package.json': `{
        "name": "blah",
        "dependencies": {
          "@angular-devkit-tests/update-base": "file:update-base-1.0.0.tgz"
        }
      }`,
        })
      )
    );

    newTree = await schematicRunner.runSchematic('update', undefined, newTree);
    const packageJson = JSON.parse(newTree.readContent('/package.json'));
    expect(
      packageJson['dependencies']['@angular-devkit-tests/update-base']
    ).toBe('file:update-base-1.0.0.tgz');
  }, 45000);
});
