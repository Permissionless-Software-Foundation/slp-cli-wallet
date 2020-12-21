/*
  TODO:

*/

'use strict'

// Public NPM libraries.
const assert = require('chai').assert
const sinon = require('sinon')

// Local libraries.
// const config = require('../../config')
const testUtil = require('../util/test-util')

// File to be tested.
const UpdateBalances = require('../../src/commands/update-balances')

// Mock data
// const testwallet = require("../mocks/testwallet.json")
// const { bitboxMock } = require("../mocks/bitbox")
const updateBalancesMocks = require('../mocks/update-balance-mocks')

// Inspect utility used for debugging.
const util = require('util')
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
  depth: 1
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('#update-balances.js', () => {
  // let mockedWallet
  // const filename = `${__dirname}/../../wallets/test123.json`
  let updateBalances
  let sandbox

  before(() => {
    testUtil.restoreWallet()
  })

  beforeEach(() => {
    updateBalances = new UpdateBalances()

    // By default, use the mocking library instead of live calls.
    // updateBalances.BITBOX = bitboxMock

    // mockedWallet = Object.assign({}, testwallet) // Clone the testwallet

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags', () => {
    it('should throw error if name is not supplied.', async () => {
      try {
        await updateBalances.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag',
          'Expected error message.'
        )
      }
    })
  })

  // describe("#generateAddresses", () => {
  //   it("should generate an address accurately.", async () => {
  //     // updateBalances.BITBOX = new config.BCHLIB({
  //     //   restURL: config.TESTNET_REST
  //     // })
  //
  //     const addr = await updateBalances.generateAddress(
  //       updateBalancesMocks.mockWallet1,
  //       3,
  //       1
  //     )
  //     //console.log(`addr: ${util.inspect(addr)}`)
  //
  //     assert.isArray(addr)
  //     assert.equal(addr.length, 1)
  //     assert.equal(
  //       addr[0],
  //       "bchtest:qqkng037s5pjhhk38mkaa3c6grl3uep845evtxvyse"
  //     )
  //   })
  //
  //   it("should generate the first 20 addresses", async () => {
  //     updateBalances.BITBOX = new config.BCHLIB({
  //       restURL: config.TESTNET_REST
  //     })
  //
  //     const addr = await updateBalances.generateAddress(
  //       updateBalancesMocks.mockWallet,
  //       0,
  //       20
  //     )
  //     //console.log(`addr: ${util.inspect(addr)}`)
  //
  //     assert.isArray(addr)
  //     assert.equal(addr.length, 20)
  //     assert.equal(addr[0], updateBalancesMocks.mockWallet.rootAddress)
  //   })
  // })

  describe('#findSlpUtxos', () => {
    it('should return utxos hydrated with token data', async () => {
      // Mock external calls if this is a unit test.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(updateBalances.bchjs.Electrumx, 'utxo')
          .resolves(updateBalancesMocks.mockElectrumxTokenUtxos)

        sandbox
          .stub(updateBalances.bchjs.SLP.Utils, 'tokenUtxoDetails')
          .resolves(updateBalancesMocks.mockTokenUtxoDetails)
      }

      const slpAddr = 'simpleledger:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huq2dqlz4h'

      const result = await updateBalances.findSlpUtxos(slpAddr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.hasAnyKeys(result[0], [
        'txid',
        'vout',
        'amount',
        'satoshis',
        'height',
        'confirmations',
        'cashAddr',
        'slpAddr'
      ])
    })
  })

  // describe('#getSlpUtxos', () => {
  //   it('should throw error if input is not an array', async () => {
  //     try {
  //       const addresses = 'bad-data'
  //
  //       await updateBalances.getSlpUtxos(addresses)
  //
  //       assert.equal(true, false, 'Unexpected result!')
  //     } catch (err) {
  //       // console.log(`Error: `, err)
  //
  //       assert.include(err.message, 'addresses must be an array')
  //     }
  //   })
  //
  //   it('should reject arrays bigger than 20', async () => {
  //     try {
  //       // Generate an array that is bigger than 20 elements.
  //       const addresses = []
  //       for (let i = 0; i < 25; i++) addresses.push(i)
  //
  //       await updateBalances.getSlpUtxos(addresses)
  //
  //       assert.equal(true, false, 'Unexpected result!')
  //     } catch (err) {
  //       // console.log(`Error: `, err)
  //
  //       assert.include(
  //         err.message,
  //         'addresses array must be 20 or fewer elements'
  //       )
  //     }
  //   })
  //
  //   it('should return information on any address with UTXO information', async () => {
  //     updateBalances.bchjs = new config.BCHLIB({
  //       restURL: config.MAINNET_REST
  //     })
  //
  //     // Mock external calls if this is a unit test.
  //     if (process.env.TEST === 'unit') {
  //       sandbox
  //         .stub(updateBalances.bchjs.Util, 'balancesForAddress')
  //         .resolves(updateBalancesMocks.mockBalancesForAddress)
  //
  //       sandbox
  //         .stub(updateBalances, 'findSlpUtxos')
  //         .resolves(updateBalancesMocks.mockTokenUtxoDetails)
  //     }
  //
  //     const addresses = [
  //       'bitcoincash:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huv3xm2ztf'
  //     ]
  //
  //     const result = await updateBalances.getSlpUtxos(addresses)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result)
  //     assert.hasAnyKeys(result[0], [
  //       'txid',
  //       'vout',
  //       'amount',
  //       'satoshis',
  //       'height',
  //       'confirmations',
  //       'utxoType',
  //       'tokenId',
  //       'tokenTicker',
  //       'tokenName',
  //       'tokenDocumentUrl',
  //       'tokenDocumentHash',
  //       'decimals',
  //       'tokenQty'
  //     ])
  //   })
  // })

  describe('#getAddressData', () => {
    it('should throw error if index is not supplied', async () => {
      try {
        await updateBalances.getAddressData(updateBalancesMocks.mockWallet1)

        assert.equal(true, false, 'unexpected result!')
      } catch (err) {
        // console.log(`err: ${util.inspect(err)}`)
        assert.include(err.message, 'index must be supplied as a number')
      }
    })

    it('should throw error if limit is not supplied', async () => {
      try {
        await updateBalances.getAddressData(updateBalancesMocks.mockWallet1, 0)

        assert.equal(true, false, 'unexpected result!')
      } catch (err) {
        // console.log(`err: ${util.inspect(err)}`)
        assert.include(
          err.message,
          'limit must be supplied as a non-zero number'
        )
      }
    })

    it('should throw error if limit is over 20', async () => {
      try {
        await updateBalances.getAddressData(
          updateBalancesMocks.mockWallet1,
          0,
          40
        )

        assert.equal(true, false, 'unexpected result!')
      } catch (err) {
        // console.log(`err: ${util.inspect(err)}`)
        assert.include(err.message, 'limit must be 20 or less')
      }
    })

    // it('should return an array of address and SLP data', async () => {
    //   // Ensure we're using testnet
    //   updateBalances.bchjs = new config.BCHLIB({
    //     restURL: config.TESTNET_REST
    //   })
    //
    //   // Mock external calls if this is a unit test.
    //   if (process.env.TEST === 'unit') {
    //     sandbox
    //       .stub(updateBalances.bchjs.Blockbook, 'balance')
    //       .resolves(updateBalancesMocks.mockAddressDetails1)
    //
    //     sandbox.stub(updateBalances, 'getSlpUtxos').resolves([])
    //   }
    //
    //   const result = await updateBalances.getAddressData(
    //     updateBalancesMocks.mockWallet,
    //     0,
    //     3
    //   )
    //   console.log(`result: ${JSON.stringify(result, null, 2)}`)
    //
    //   assert.isArray(result.balances)
    //   assert.isArray(result.slpUtxos)
    //
    //   // Ensure balances index the HD wallet index for the address.
    //   assert.property(result.balances[0], 'hdIndex')
    // })

    // it('should return an data on 20 addresses', async () => {
    //   // Ensure we're using testnet
    //   updateBalances.bchjs = new config.BCHLIB({
    //     restURL: config.TESTNET_REST
    //   })
    //
    //   // Mock external calls if this is a unit test.
    //   if (process.env.TEST === 'unit') {
    //     sandbox
    //       .stub(updateBalances.bchjs.Blockbook, 'balance')
    //       .resolves(updateBalancesMocks.mockAddressDetails1)
    //
    //     sandbox.stub(updateBalances, 'getSlpUtxos').resolves([])
    //   }
    //
    //   const result = await updateBalances.getAddressData(
    //     updateBalancesMocks.mockWallet,
    //     0,
    //     3
    //   )
    //   // console.log(`result: ${JSON.stringify(result, null, 2)}`)
    //
    //   assert.isArray(result.balances)
    //   assert.isArray(result.slpUtxos)
    //
    //   // Ensure balances index the HD wallet index for the address.
    //   assert.property(result.balances[0], 'hdIndex')
    // })
  })

  describe('#detectBalance', () => {
    it('should return true when addresses have balance', () => {
      const result = updateBalances.detectBalance(
        updateBalancesMocks.mockAddressDetails1
      )
      // console.log(`result: ${util.inspect(result)}`)

      assert.equal(result, true, 'Boolean true expected.')
    })

    it('should return false when addresses have no balance', () => {
      const result = updateBalances.detectBalance(
        updateBalancesMocks.mockAddressDetails2
      )

      assert.equal(result, false, 'Boolean false expected.')
    })
  })

  describe('#getAllAddressData', () => {
    it('should get all address data', async () => {
      // Use mocked data if this is a unit test.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(updateBalances, 'getAddressData')
          .onFirstCall()
          .resolves({
            balances: updateBalancesMocks.mockAddressDetails1,
            slpUtxos: []
          })
          .onSecondCall()
          .resolves({
            balances: updateBalancesMocks.mockAddressDetails1,
            slpUtxos: []
          })
          .onThirdCall()
          .resolves({
            balances: updateBalancesMocks.mockAddressDetails2,
            slpUtxos: []
          })
      }

      const result = await updateBalances.getAllAddressData(
        updateBalancesMocks.mockWallet1
      )
      // console.log(`result: ${util.inspect(result)}`)

      assert.isArray(result.addressData)
      assert.isArray(result.slpUtxoData)
    })
  })

  describe('#generateHasBalance', () => {
    it('generates a hasBalance array', async () => {
      const hasBalance = await updateBalances.generateHasBalance(
        updateBalancesMocks.mockAddressDetails1,
        updateBalancesMocks.mockWallet1
      )
      // console.log(`hasBalance: ${util.inspect(hasBalance)}`)

      assert.isArray(hasBalance, 'Expect array of addresses with balances.')
      assert.hasAllKeys(hasBalance[0], [
        'index',
        'balance',
        'balanceSat',
        'unconfirmedBalance',
        'unconfirmedBalanceSat',
        'cashAddress'
      ])
    })
  })

  describe('#sumConfirmedBalances', () => {
    it('should aggregate balances', async () => {
      const balanceTotal = await updateBalances.sumConfirmedBalances(
        updateBalancesMocks.hasBalanceMock
      )
      // console.log(`balanceTotal: ${balanceTotal}`)

      assert.equal(balanceTotal, 0.09977288)
    })
  })

  describe('#updateBalances', () => {
    // Only run this test as an integration test.
    // DANGER! Due to the mocking used in unit tests, this test will never end.
    if (process.env.TEST !== 'unit') {
      it('should update balances', async () => {
        // Use the real library.

        const flags = {
          name: 'test123'
        }

        const walletInfo = await updateBalances.updateBalances(flags)
        // console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)

        assert.hasAllKeys(walletInfo, [
          'network',
          'mnemonic',
          'balance',
          'balanceConfirmed',
          'balanceUnconfirmed',
          'nextAddress',
          'hasBalance',
          'rootAddress',
          'name',
          'derivation',
          'SLPUtxos',
          'addresses',
          'BCHUtxos'
        ])

        assert.isArray(
          walletInfo.hasBalance,
          'Expect array of addresses with balances.'
        )
      })
    }
  })

  describe('#addSLPIndex', () => {
    it('should return token UTXOs with index value', () => {
      const result = updateBalances.addSLPIndex(
        updateBalancesMocks.mockAddressData,
        updateBalancesMocks.mockSlpUtxoData
      )
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAnyKeys(result[0], ['hdIndex'])
      assert.equal(result[0].hdIndex, 9)
    })
  })
})
