const {expect, test} = require('@oclif/test')

describe('nft-remove-child', () => {
  test
  .stdout()
  .command(['nft-remove-child'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['nft-remove-child', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
