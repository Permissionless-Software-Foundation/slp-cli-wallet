/*
  A test utility library.
*/

const shell = require('shelljs')

// Restore a the token wallet.
// Used in the update-balances test.
function restoreWallet () {
  // console.log(`__dirname: ${__dirname}`)
  shell.cp(
    `${__dirname.toString()}/../mocks/token-wallet.json`,
    `${__dirname.toString()}/../../wallets/test123.json`
  )
}

module.exports = {
  restoreWallet
}
