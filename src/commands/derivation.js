/*
  Changes the derivation path used by the wallet to generate addresses. Common
  derivation settings:
  145 - BIP44 standard path for Bitcoin Cash
  245 - BIP44 standard path for SLP tokens
  0 - Used by common software like the Bitcoin.com wallet and Honest.cash
*/

'use strict'

const AppUtils = require('../util')
const appUtils = new AppUtils()

const { Command, flags } = require('@oclif/command')

class Derivation extends Command {
  async run () {
    try {
      const { flags } = this.parse(Derivation)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const filename = `${__dirname.toString()}/../../wallets/${
        flags.name
      }.json`
      const walletData = appUtils.openWallet(filename)
      console.log(`Current derivation path: ${walletData.derivation}`)

      // Save a new derivation.
      if (flags.save) {
        const result = this.saveDerivation(flags, filename, walletData)

        if (result) {
          console.log(
            `New derivation path of ${flags.save} saved to wallet file.`
          )
        }
      }
    } catch (err) {
      // if (err.message) console.log(err.message)
      // console.log('Error in Derivation.run: ', err)

      console.log('Error in derivation.js/run: ', err.message)
    }
  }

  // Update the wallet file with the new derivation path.
  saveDerivation (flags, filename, walletData) {
    try {
      // Set the new derivation path.
      walletData.derivation = flags.save

      // Save the wallet.
      appUtils.saveWallet(filename, walletData)

      return true
    } catch (err) {
      console.log('Error in derivation.js/saveDerivation()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    const save = flags.save
    if (save) {
      const intCheck = parseInt(save)
      if (isNaN(intCheck)) {
        throw new Error('Derivation path must be an integer.')
      }
    }

    return true
  }
}

Derivation.description = `Display or set the derivation path used by the wallet.
This command is used to display the derivation path used by the wallet. The -s
flag can be used to save a new derivation path.

Common derivation paths used:
145 - BIP44 standard path for Bitcoin Cash
245 - BIP44 standard path for SLP tokens
0 - Used by common software like the Bitcoin.com wallet and Honest.cash

Wallets use the 245 derivation path by default.
`

Derivation.flags = {
  name: flags.string({ char: 'n', description: 'name to print' }),
  save: flags.string({ char: 's', description: 'save a new derivation path' })
}

module.exports = Derivation
