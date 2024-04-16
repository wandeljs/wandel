import main from './index';

describe('wandel init', () => {
  it('error when no name is provided', async () => {
    const res = await main.run?.({
      args: { force: false, dryRun: true, verbose: false, cwd: './', _: [] },
      cmd: {},
      rawArgs: [],
      subCommand: undefined,
    });
    await expect(res.toPromise()).rejects.toThrow('name option is required');
  });
});
