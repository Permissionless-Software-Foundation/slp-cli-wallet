'use strict'

const shelljs = require('shelljs')
const Table = require('cli-table')

const { Command } = require('@oclif/command')

class ListWallets extends Command {
  async run () {
    // const { flags } = this.parse(ListWallets)

    const walletData = this.parseWallets()
    // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

    return this.displayTable(walletData)
  }

  // Parse data from the wallets directory into a formatted array.
  parseWallets () {
    const fileList = shelljs.ls(`${__dirname.toString()}/../../wallets/*.json`)

    if (fileList.length === 0) {
      console.log('No wallets found.')
      return []
    }

    const retData = []

    // Loop through each wallet returned.
    for (let i = 0; i < fileList.length; i++) {
      const thisFile = fileList[i]
      // console.log(`thisFile: ${thisFile}`)

      const lastPart = thisFile.indexOf('.json')

      const lastSlash = thisFile.indexOf('wallets/')
      // console.log(`lastSlash: ${lastSlash}`)

      let name = thisFile.slice(8, lastPart)
      // console.log(`name: ${name}`)

      name = name.slice(lastSlash)

      // Delete the cached copy of the wallet. This allows testing of list-wallets.
      delete require.cache[require.resolve(`${thisFile}`)]

      const walletInfo = require(`${thisFile}`)

      retData.push([name, walletInfo.network, walletInfo.balance])
    }

    return retData
  }

  // Display table in a table on the command line using cli-table.
  displayTable (data) {
    const table = new Table({
      head: ['Name', 'Network', 'Balance (BCH)'],
      colWidths: [25, 15, 15]
    })

    for (let i = 0; i < data.length; i++) table.push(data[i])

    const tableStr = table.toString()

    // Cut down on screen spam when running unit tests.
    if (process.env.TEST !== 'unit') {
      console.log(tableStr)
    }

    return tableStr
  }
}

ListWallets.description = 'List existing wallets.'

ListWallets.flags = {
  // testnet: flags.boolean({ char: "t", description: "Create a testnet wallet" }),
  // name: flags.string({ char: "n", description: "Name of wallet" })
}

module.exports = ListWallets
