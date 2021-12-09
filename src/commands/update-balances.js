/*
  oclif command to update the balances stored in the wallet.json file.

  TODO:
   - Add notes on the general high-level workflow of this command.
   - Replace Blockbook with Electrumx

  Command Workflow:
  - validateFlags() validates the flags passed into the command.
  - updateBalances() is the parent function that kicks off this command.
    - getAllAddressData() queries data on all addresses generated by the wallet.
      - getAddressBalances() get BCH balance data on a block of 20 addresses.
      - getAddressUtxos() get UTXO information for a block of 20 addresses.
      - getSLPData() hydrate UTXO data with SLP information for a block of 20 addresses.
    - generateHasBalance() creates an array of addresses with address balances.
    - sumConfirmedBalances() generates a total balance from confirmed and unconfirmed balances.
    - displayTokenBalances() displays SLP token info on the console.
    - saveWallet() saves the data to the wallet file.

*/

'use strict'

const collect = require('collect.js')

const AppUtils = require('../util')
const appUtils = new AppUtils()

const config = require('../../config')

// Mainnet by default
const bchjs = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

// Used for debugging and error reporting.
const util = require('util')
util.inspect.defaultOptions = { depth: 2 }

const SATS_PER_BCH = 100000000

const { Command, flags } = require('@oclif/command')

class UpdateBalances extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Default libraries.
    this.bchjs = bchjs
    this.appUtils = appUtils

    // If bchjs is specified, override it with that.
    if (config && config.bchjs) {
      this.bchjs = config.bchjs
      this.appUtils = new AppUtils({ bchjs: this.bchjs })
    }
  }

  async run () {
    try {
      const { flags } = this.parse(UpdateBalances)

      this.validateFlags(flags)

      // Update the balances in the wallet.
      const walletInfo = await this.updateBalances(flags)

      console.log(`Updated balance: ${walletInfo.balance} BCH`)
    } catch (err) {
      // Catch most common error: querying too fast.
      if (err.error) {
        console.log(err.error)
        return
      }

      if (err.message) console.log(err.message)
      // console.log('Error in UpdateBalances.run: ', err)
    }
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

  // Update the balances in the wallet.
  async updateBalances (flags) {
    const name = flags.name

    // Open the wallet data file.
    const filename = `${__dirname.toString()}/../../wallets/${name}.json`
    const walletInfo = this.appUtils.openWallet(filename)
    walletInfo.name = name

    console.log(`Existing balance: ${walletInfo.balance} BCH`)

    // Determine if this is a testnet wallet or a mainnet wallet.
    if (walletInfo.network === 'testnet') {
      this.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
    }

    // console.log(`debug: walletInfo.nextAddress = ${walletInfo.nextAddress}`)

    // Query data on each address that has been generated by the wallet.
    // const addressData = await this.getAddressData(walletInfo)
    const addressData = await this.getAllAddressData(
      walletInfo,
      flags.ignoreTokens
    )
    // console.log(`addressData: ${JSON.stringify(addressData, null, 2)}`)

    // Exit if this is a new wallet that does not need to be updated.
    if (addressData.addressData.length === 0) {
      walletInfo.balance = 0
      walletInfo.balanceConfirmed = 0
      walletInfo.balanceUnconfirmed = 0
      walletInfo.hasBalance = []
      walletInfo.SLPUtxos = []
      walletInfo.BCHUtxos = []

      await this.appUtils.saveWallet(filename, walletInfo)

      return walletInfo
    }

    // Update hasBalance array with non-zero balances.
    // const hasBalance = this.generateHasBalance(addressData.addressData)
    const hasBalance = await this.generateHasBalance(
      addressData.addressData,
      walletInfo
    )
    // console.log(`hasBalance: ${JSON.stringify(hasBalance, null, 2)}`)

    // Sum all the balances in hasBalance to calculate total balance.
    const balance = this.sumConfirmedBalances(hasBalance, true)

    // Summarize token balances
    this.displayTokenBalances(addressData.slpUtxoData)

    // Save the data to the wallet JSON file.
    walletInfo.balance = this.appUtils.eightDecimals(
      balance.totalConfirmed + balance.totalUnconfirmed
    )
    walletInfo.balanceConfirmed = balance.totalConfirmed
    walletInfo.balanceUnconfirmed = balance.totalUnconfirmed
    walletInfo.hasBalance = hasBalance
    walletInfo.SLPUtxos = addressData.slpUtxoData
    walletInfo.BCHUtxos = addressData.bchUtxoData
    await this.appUtils.saveWallet(filename, walletInfo)

    return walletInfo
  }

  // Display summary of token balances in the wallet.
  displayTokenBalances (slpUtxos) {
    try {
      // console.log(`slpUtxos: ${JSON.stringify(slpUtxos, null, 2)}`)

      // Create an array of just token IDs
      let tokenIds = slpUtxos.map(x => x.utxos.map(y => y.tokenId))

      // Flatten the array.
      tokenIds = tokenIds.flat()
      // console.log(`tokenIds: ${JSON.stringify(tokenIds, null, 2)}`)

      // Create a unique collection of tokenIds
      const collection = collect(tokenIds)
      let unique = collection.unique()
      unique = unique.toArray()

      // Create an array of token tickers that correspond to the unique token IDs.
      const tickers = []

      console.log(' ')
      console.log('SLP Token Summary:')
      console.log('Ticker Balance TokenID')

      // Loop through each unique tokenID.
      for (let i = 0; i < unique.length; i++) {
        const thisTokenId = unique[i]

        let total = 0

        // Loop through each address.
        for (let j = 0; j < slpUtxos.length; j++) {
          // Loop through each UTXO in the current address.
          // If it matches, the current token ID, add
          // it to the total.
          for (let k = 0; k < slpUtxos[j].utxos.length; k++) {
            const thisUtxo = slpUtxos[j].utxos[k]

            // If the token Ids match,
            // and if this is not a minting baton.
            if (
              thisUtxo.tokenId.toString() === thisTokenId.toString() &&
              thisUtxo.utxoType !== 'minting-baton'
            ) {
              // Add the ticker to the array.
              tickers[i] = thisUtxo.tokenTicker

              // Add the token quantity to the total.
              total += Number(thisUtxo.tokenQty)
            }
          }
        }

        // Write out summary info to the console.
        console.log(
          `${tickers[i]} ${this.appUtils.eightDecimals(total)} ${thisTokenId}`
        )
      }
      console.log(' ')
    } catch (err) {
      console.log('Error in update-balances.js/displayTokenBalances()')
      throw err
    }
  }

  // Retrieves data for every address generated by the wallet.
  // Returns an array of address data for every address generated by the wallet.
  async getAllAddressData (walletInfo, ignoreTokens = false) {
    try {
      let addressData = [] // Accumulates address data.
      let slpUtxoData = [] // Accumulates SLP token UTXOs.
      let bchUtxoData = [] // Accumulates BCH (non-SLP) UTXOs.
      let currentIndex = 0 // tracks the current HD index.
      let batchHasBalance = true // Flag to signal when last address found.

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (walletInfo.network === 'testnet') {
        this.bchjs = new config.BCHLIB({ restURL: config.TESTNET_REST })
      }

      // Scan the derivation path of addresses until a block of 20 is found that
      // contains no balance. This follows the standard BIP45 specification.
      while (batchHasBalance || currentIndex < walletInfo.nextAddress) {
        // while (batchHasBalance || currentIndex < 60) {
        // Get a 20-address batch of data.
        const thisDataBatch = await this.getAddressData(
          walletInfo,
          currentIndex,
          20,
          ignoreTokens
        )
        // console.log(`thisDataBatch: ${util.inspect(thisDataBatch)}`)
        // console.log(`thisDataBatch: ${JSON.stringify(thisDataBatch, null, 2)}`)

        // Increment the index by 20 (addresses).
        currentIndex += 20

        // console.log(
        //   `thisDataBatch.balances: ${JSON.stringify(
        //     thisDataBatch.balances,
        //     null,
        //     2
        //   )}`
        // )

        // Check if data has no balance. no balance == last address.
        batchHasBalance = this.detectBalance(thisDataBatch.balances)
        // console.log(`batchHasBalance: ${batchHasBalance}`)

        // Add data to the array, unless this last batch has no balances.
        if (batchHasBalance) {
          addressData = addressData.concat(thisDataBatch.balances)
          slpUtxoData = slpUtxoData.concat(thisDataBatch.slpUtxos)
          bchUtxoData = bchUtxoData.concat(thisDataBatch.bchUtxos)
        }
        // console.log(`addressData: ${util.inspect(addressData)}`)
        // console.log(`slpUtxoData: ${JSON.stringify(slpUtxoData, null, 2)}`)

        // Protect against run-away while loop.
        if (currentIndex > 10000) break
      }

      // Add the HD index to the SLP UTXO data, so the wallet knows which HD
      // address the SLP UTXO belongs to.
      // slpUtxoData = this.addSLPIndex(addressData, slpUtxoData)

      return { addressData, slpUtxoData, bchUtxoData }
    } catch (err) {
      console.log('Error in update-balances.js/getAllAddressData()')
      throw err
    }
  }

  // All addresses in the wallet are generated by the HD node. For each SLP
  // UTXO, this function identifies which index of the HD node the UTXO belongs
  // to. Each index corresponds to an address generated by the HD node. This
  // information is needed when spending the SLP UTXO.
  addSLPIndex (addressData, slpUtxoData) {
    // console.log(`addressData: ${JSON.stringify(addressData, null, 2)}`)
    // console.log(`slpUtxoData: ${JSON.stringify(slpUtxoData, null, 2)}`)

    try {
      // Loop through each SLP UTXO
      for (let i = 0; i < slpUtxoData.length; i++) {
        const slpUtxo = slpUtxoData[i]

        // Loop through the array of address data
        for (let j = 0; j < addressData.length; j++) {
          const bchAddr = addressData[j]

          // If the cash addresses match, record the HD index in the SLP UTXO.
          if (bchAddr.address === slpUtxo.cashAddr) slpUtxo.hdIndex = j
        }
      }

      return slpUtxoData
    } catch (err) {
      console.log('Error in update-balances.js/addSLPIndex()')
      throw err
    }
  }

  // Returns true if any of the address data has a balance.
  // dataBatch is expected to be an array of address data.
  detectBalance (dataBatch) {
    try {
      // Loop through the address data in the dataBatch array.
      for (let i = 0; i < dataBatch.length; i++) {
        const thisAddr = dataBatch[i]

        // Exit if a balance is detected in any of the addresses.
        if (
          Number(thisAddr.balance.confirmed) > 0 ||
          Number(thisAddr.balance.unconfirmed) > 0
        ) {
          return true
        }
      }

      // If the loop completes without finding a balance, return false.
      return false
    } catch (err) {
      console.log('Error in update-balances.js/detectBalance()')
      throw err
    }
  }

  // Retrieves details data (objects) on addresses in an HD wallet from REST server.
  // A max of 20 addresses can be retrieved at a time.
  // Addresses start at the index and the number of address data retrieved is
  // set by the limit (up to 20). Data is returned as an object with balance and
  // hydrated utxo data.
  async getAddressData (walletInfo, index, limit, ignoreTokens = false) {
    try {
      if (isNaN(index)) throw new Error('index must be supplied as a number.')

      if (!limit || isNaN(limit)) {
        throw new Error('limit must be supplied as a non-zero number.')
      }

      if (limit > 20) throw new Error('limit must be 20 or less.')

      console.log(
        `Getting address data at index ${index} up to index ${index + limit}`
      )

      // Get the list of addresses.
      const addresses = await this.appUtils.generateAddress(
        walletInfo,
        index,
        limit
      )
      // console.log(`addresses: ${util.inspect(addresses)}`)

      // get BCH balance and details for each address.
      const balances = await this.bchjs.Electrumx.balance(addresses)
      // console.log(`balances: ${JSON.stringify(balances, null, 2)}`)

      // Add the HD Index to each balance.
      for (let i = 0; i < balances.balances.length; i++) {
        const hdIndex = index + i
        balances.balances[i].hdIndex = hdIndex
      }
      // console.log(`balances: ${JSON.stringify(balances, null, 2)}`)

      // Get UTXO data.
      const utxos = await this.bchjs.Electrumx.utxo(addresses)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // Hydrate UTXO data with SLP info.
      const hydratedUtxos = await this.bchjs.SLP.Utils.hydrateUtxos(utxos.utxos)
      // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

      // Add the hdIndex and address to each UTXO.
      // Loop through each address.
      for (let i = 0; i < hydratedUtxos.slpUtxos.length; i++) {
        const thisAddr = hydratedUtxos.slpUtxos[i].address
        const theseUtxos = hydratedUtxos.slpUtxos[i].utxos

        // Look up the HD Index for this address.
        const hdIndex = balances.balances.filter(x => x.address === thisAddr)
        // console.log(`hdIndex: ${JSON.stringify(hdIndex, null, 2)}`)

        // Loop through each UTXO in the address.
        for (let j = 0; j < theseUtxos.length; j++) {
          const thisUtxo = theseUtxos[j]

          thisUtxo.address = thisAddr
          thisUtxo.hdIndex = hdIndex[0].hdIndex
        }
      }
      // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

      // Filter out the SLP and BCH UTXOs.
      const { bchUtxos, slpUtxos } = await this.filterUtxos(
        hydratedUtxos.slpUtxos
      )

      return { balances: balances.balances, bchUtxos, slpUtxos }
    } catch (err) {
      // console.log('Error: ', err)
      console.log('Error in update-balances.js/getAddressData(): ', err)
      throw err
    }
  }

  // Expects an array of utxo objects and returns two filtered lists. One of
  // BCH-only UTXOs and the other of SLP-only UTXOs.
  //
  // Any hydrated utxos with an isValid=null setting is ignored and not
  // included in either list. This prevents accidentally burning tokens.
  async filterUtxos (hydratedUtxos) {
    try {
      let bchUtxos = []
      let slpUtxos = []

      // Loop through the array of hydrated UTXOs.
      for (let i = 0; i < hydratedUtxos.length; i++) {
        const thisUtxoObj = hydratedUtxos[i]

        const bchUtxoObj = {
          address: thisUtxoObj.address,
          utxos: []
        }

        const slpUtxoObj = {
          address: thisUtxoObj.address,
          utxos: []
        }

        // Loop through the UTXOs in each object.
        for (let j = 0; j < thisUtxoObj.utxos.length; j++) {
          let thisUtxo = thisUtxoObj.utxos[j]
          // console.log(`utxo: ${JSON.stringify(thisUtxo, null, 2)}`)

          // Hydrate the UTXO using slp-api if SLPDB returns null.
          // WARNING: This does not support testnet.
          if (thisUtxo.isValid === null) {
            console.warn(
              `Warning: Unvalidated UTXO detected: ${thisUtxo.tx_hash}`
            )
            // console.log(`thisUtxo: ${JSON.stringify(thisUtxo, null, 2)}`)
            thisUtxo = await this.bkupValidate(thisUtxo)
          }

          if (thisUtxo.isValid === false && thisUtxo.tokenTicker) {
            console.warn('Warning: hydrated UTXO is showing as invalid?!')
            console.log(`thisUtxo: ${JSON.stringify(thisUtxo, null, 2)}`)

            console.log(
              `isValid before using bckupValidate: ${thisUtxo.isValid}`
            )
            thisUtxo = await this.bkupValidate(thisUtxo)
            console.log(
              `isValid after using bckupValidate: ${thisUtxo.isValid}`
            )
          }

          // Add if this is an SLP UTXO.
          if (thisUtxo.isValid) {
            slpUtxoObj.utxos.push(thisUtxo)

            // Add if this is a BCH UTXO
          } else {
            bchUtxoObj.utxos.push(thisUtxo)
          }
        }

        bchUtxos.push(bchUtxoObj)
        slpUtxos.push(slpUtxoObj)
      }

      // Prune off empty entries from the array.
      bchUtxos = this.pruneUtxos(bchUtxos)
      slpUtxos = this.pruneUtxos(slpUtxos)

      return { bchUtxos, slpUtxos }
    } catch (err) {
      console.error('Error in filterUtxos()')
      throw err
    }
  }

  // This function expects a UTXO object that contains an array of UTXOs. It
  // returns an array of UTXOs that contain data. It prunes off any elements that
  // do not contain UTXO data.
  pruneUtxos (utxosObj) {
    try {
      const prunedUtxos = []

      for (let i = 0; i < utxosObj.length; i++) {
        const thisElem = utxosObj[i]

        if (thisElem.utxos.length > 0) prunedUtxos.push(thisElem)
      }

      return prunedUtxos
    } catch (err) {
      console.error('Error in pruneUtxos()')
      throw err
    }
  }

  // Retrieves SLP Utxos for an address that has been identified to be holding
  // SLP tokens.
  async findSlpUtxos (slpAddr) {
    try {
      // console.log(`slpAddr: ${slpAddr}`)

      // Convert the slpAddr to a cashAddr.
      const cashAddr = this.bchjs.SLP.Address.toCashAddress(slpAddr)
      // console.log(`cashAddr: ${cashAddr}`)

      // Get utxos associated with this address.
      const fulcrumUtxos = await this.bchjs.Electrumx.utxo(cashAddr)
      // console.log(`fulcrumUtxos: ${JSON.stringify(fulcrumUtxos, null, 2)}`)
      const utxos = fulcrumUtxos.utxos
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // Figure out which UTXOs are associated with SLP tokens.
      const isTokenUtxo = await this.bchjs.SLP.Utils.tokenUtxoDetails(utxos)
      // console.log(`isTokenUtxo: ${JSON.stringify(isTokenUtxo, null, 2)}`)

      // Filter out just the UTXOs that belong to SLP tokens.
      const tokenUtxos = []
      for (let i = 0; i < isTokenUtxo.length; i++) {
        if (isTokenUtxo[i]) tokenUtxos.push(utxos[i])
      }

      // Add address data to each UTXO.
      for (let i = 0; i < tokenUtxos.length; i++) {
        tokenUtxos[i].cashAddr = cashAddr
        tokenUtxos[i].slpAddr = slpAddr
      }
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

      return tokenUtxos
    } catch (err) {
      console.log('Error in update-balances.js/findSlpUtxo().')
      throw err
    }
  }

  // Generates the data that will be stored in the hasBalance array of the
  // wallet JSON file.
  async generateHasBalance (addressData, walletInfo) {
    try {
      const hasBalance = []

      // Enable backward-compatible wallets by adding an addresses property,
      // if it's missing.
      if (walletInfo.addresses === undefined) walletInfo.addresses = []

      // Loop through each HD address index
      for (let i = 0; i < walletInfo.nextAddress; i++) {
        const thisAddr = addressData[i]
        // console.log(`thisAddr: ${JSON.stringify(thisAddr, null, 2)}`)

        // Handle corner-case.
        if (!thisAddr) break

        const hdIndex = thisAddr.hdIndex

        // If the addresses array does not have the current address, add it.
        const found = walletInfo.addresses.find(x => x[0] === hdIndex)
        // console.log(`found: ${JSON.stringify(found, null, 2)}`)
        if (!found || found.length === 0) {
          walletInfo.addresses.push([hdIndex, thisAddr.address])
        }

        // If the address has a balance, add it to the hasBalance array.
        if (
          Number(thisAddr.balance.confirmed) > 0 ||
          Number(thisAddr.balance.unconfirmed) > 0
        ) {
          const thisObj = {
            index: hdIndex,
            balance: this.appUtils.eightDecimals(
              Number(thisAddr.balance.confirmed) / SATS_PER_BCH
            ),
            balanceSat: Number(thisAddr.balance.confirmed),
            unconfirmedBalance: this.appUtils.eightDecimals(
              Number(thisAddr.balance.unconfirmed) / SATS_PER_BCH
            ),
            unconfirmedBalanceSat: Number(thisAddr.balance.unconfirmed),
            cashAddress: thisAddr.address
          }

          hasBalance.push(thisObj)
        }
      }

      return hasBalance
    } catch (err) {
      console.log('Error in update-balances.js/generateHasBalance(): ', err)
      throw err
    }
  }

  // Sums the confirmed balances in the hasBalance array to create a single,
  // aggrigate balance
  sumConfirmedBalances (hasBalance, verbose) {
    try {
      let total = 0
      let totalConfirmed = 0
      let totalUnconfirmed = 0

      for (let i = 0; i < hasBalance.length; i++) {
        const thisHasBalance = hasBalance[i]

        total += thisHasBalance.balance + thisHasBalance.unconfirmedBalance
        totalConfirmed += thisHasBalance.balance
        totalUnconfirmed += thisHasBalance.unconfirmedBalance
      }

      // Convert to satoshis
      const totalSatoshis = Math.floor(total * SATS_PER_BCH)
      const totalConfirmedSatoshis = Math.floor(totalConfirmed * SATS_PER_BCH)
      const totalUnconfirmedSatoshis = Math.floor(
        totalUnconfirmed * SATS_PER_BCH
      )

      // Convert back to BCH
      total = totalSatoshis / SATS_PER_BCH
      totalConfirmed = totalConfirmedSatoshis / SATS_PER_BCH
      totalUnconfirmed = totalUnconfirmedSatoshis / SATS_PER_BCH

      if (verbose) return { totalConfirmed, totalUnconfirmed }

      return total
    } catch (err) {
      console.log('Error in update-balances.js/sumConfirmedBalances()')
      throw err
    }
  }

  // Backup SLP Validation. Hydrate the UTXO using slp-api. This is a backup
  // method that is slower, but independent of SLPDB.
  async bkupValidate (utxo) {
    try {
      const options = {
        method: 'POST',
        url: 'https://slp-api.fullstack.cash/slp/hydrateUtxos',
        data: {
          utxos: [utxo]
        }
      }

      let details = []

      const result = await this.bchjs.SLP.TokenType1.axios.request(options)
      details = [...details, ...result.data.details]
      // console.log(`details: ${JSON.stringify(details, null, 2)}`)

      return details[0]
    } catch (err) {
      console.error('Error in bkupValidate()')
      throw err
    }
  }
}

UpdateBalances.description =
  'Poll the network and update the balances of the wallet.'

UpdateBalances.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  ignoreTokens: flags.boolean({
    char: 'i',
    description: 'Ignore and burn tokens'
  })
}

module.exports = UpdateBalances
