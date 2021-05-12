'use strict'

const shelljs = require('shelljs')

const { Command, flags } = require('@oclif/command')

class RemoveWallet extends Command {
  async run () {
    try {
      const { flags } = this.parse(RemoveWallet)

      // Validate input flags
      this.validateFlags(flags)

      const filename = `${__dirname.toString()}/../../wallets/${
        flags.name
      }.json`

      return this.removeWallet(filename)
    } catch (err) {
      console.log('Error: ', err)
    }
  }

  async removeWallet (filename) {
    const result = shelljs.rm(filename)

    if (!shelljs.error()) return result

    throw new Error(result.stderr || 'Error in removeWallet().')
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    return true
  }
}

RemoveWallet.description = 'Remove an existing wallet.'

RemoveWallet.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' })
}

module.exports = RemoveWallet
