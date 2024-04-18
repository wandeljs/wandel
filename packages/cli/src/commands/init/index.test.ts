import main from './index';

describe('wandel init', () => {
  it('dry-run is default when debug mode', async () => {
    const res = await main.run?.({
      args: {
        force: false,
        dryRun: true,
        verbose: false,
        cwd: './',
        _: [],
        name: 'foo',
      },
      cmd: {},
      rawArgs: [],
      subCommand: undefined,
    });
    expect(res).toBe(0);
  });

  it('error when no name is provided', async () => {
    const res = await main.run?.({
      args: { force: false, dryRun: true, verbose: false, cwd: './', _: [] },
      cmd: {},
      rawArgs: [],
      subCommand: undefined,
    });
    expect(res).toBe(1);
  });
});
