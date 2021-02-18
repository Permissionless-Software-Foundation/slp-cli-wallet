/*
  Contains mocks of BITBOX library calls.
*/

'use strict'

const sinon = require('sinon')

// Inspect JS Objects.
const util = require('util')
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true
}

const addressDetails = [
  {
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: [],
    legacyAddress: 'mv9wPCHx2iCdbXBkJ1UTAZCAq57PCL2YQ9',
    cashAddress: 'bchtest:qzsfqeqtdk6plsvglccadkqtf0trf2nyz58090e6tt',
    addressIndex: 0
  },
  {
    balance: 0,
    balanceSat: 0,
    totalReceived: 0.1,
    totalReceivedSat: 10000000,
    totalSent: 0.1,
    totalSentSat: 10000000,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 2,
    transactions: [
      '26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b',
      '85ddb8215fc3701a493cf1c450644c5ef32c55aaa2f48ae2d008944394f3e4d3'
    ],
    legacyAddress: 'n3A9BmjrEG3ubJeoAJGwjkymhmqZhGbZR2',
    cashAddress: 'bchtest:qrkkx8au5lxsu2hka2c4ecn3juxjpcuz05wh08hhl2',
    addressIndex: 1
  },
  {
    balance: 0.03,
    balanceSat: 3000000,
    totalReceived: 0.03,
    totalReceivedSat: 3000000,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 1,
    transactions: [
      '26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b'
    ],
    legacyAddress: 'msnHMfK2pwaBWdE7a7y4f7atdzYahRM7t8',
    cashAddress: 'bchtest:qzrg022p8ykc90c27gy808pmz3lzlwk6lg77y3h8fm',
    addressIndex: 2
  },
  {
    balance: 0.06999752,
    balanceSat: 6999752,
    totalReceived: 0.06999752,
    totalReceivedSat: 6999752,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 1,
    transactions: [
      '26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b'
    ],
    legacyAddress: 'mjSPWfCwCgHZC27nS8GQ4AXz9ehhb2GFqz',
    cashAddress: 'bchtest:qq4sx72yfuhqryzm9h23zez27n6n24hdavvfqn2ma3',
    addressIndex: 3
  }
]

/*
const utxos = [
  [
    {
      txid: "26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b",
      vout: 1,
      scriptPubKey: "76a9142b0379444f2e01905b2dd511644af4f53556edeb88ac",
      amount: 0.06999752,
      satoshis: 6999752,
      height: 1265272,
      confirmations: 644,
      legacyAddress: "mjSPWfCwCgHZC27nS8GQ4AXz9ehhb2GFqz",
      cashAddress: "bchtest:qq4sx72yfuhqryzm9h23zez27n6n24hdavvfqn2ma3",
      hdIndex: 3
    },
    {
      txid: "26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b",
      vout: 0,
      scriptPubKey: "76a9148687a941392d82bf0af208779c3b147e2fbadafa88ac",
      amount: 0.03,
      satoshis: 3000000,
      height: 1265272,
      confirmations: 733,
      legacyAddress: "mjSPWfCwCgHZC27nS8GQ4AXz9ehhb2GFqz",
      cashAddress: "bchtest:qq4sx72yfuhqryzm9h23zez27n6n24hdavvfqn2ma3",
      hdIndex: 2
    }
  ]
]
*/

const utxos = {
  utxos: [
    {
      txid: '540894b009d0259c5de6142d6f5a421be9ec3b37f7ef07f07f84db8554587aeb',
      vout: 0,
      amount: 0.00001111,
      satoshis: 1111,
      height: 571488,
      confirmations: 1
    },
    {
      txid: '9ff10bd26d4749b8b247184ee1ca10713b9b180d4b829ebf5df9ef60cdfe1cca',
      vout: 1,
      amount: 0.00079504,
      satoshis: 79504,
      height: 571488,
      confirmations: 1
    }
  ],
  legacyAddress: '1PxJkXVkst3fJiee9mBQvuMPRvpUhySNKm',
  cashAddress: 'bitcoincash:qrausanyxjsddlhg8yuq78zysc440cvmsvapx9qarg',
  scriptPubKey: '76a914fbc8766434a0d6fee839380f1c44862b57e19b8388ac'
}

const ElectrumXTransactionsResponse = {
  success: true,
  transactions: [],
  catch: sinon.stub()
}

const ElectrumXBalanceResponse = {
  success: true,
  balancec: { confirmed: 0, unconfirmed: 0 },
  catch: sinon.stub()
}

class mockTransactionBuilder {
  constructor () {
    this.hashTypes = {
      SIGHASH_ALL: 0x01,
      SIGHASH_NONE: 0x02,
      SIGHASH_SINGLE: 0x03,
      SIGHASH_ANYONECANPAY: 0x80,
      SIGHASH_BITCOINCASH_BIP143: 0x40,
      ADVANCED_TRANSACTION_MARKER: 0x00,
      ADVANCED_TRANSACTION_FLAG: 0x01
    }

    this.transaction = new MockTxBuilder()
  }

  addInput () {
    sinon.stub().returns({})
  }

  addOutput () {
    sinon.stub().returns({})
  }

  sign () {
    sinon.stub().returns({})
  }

  build () {
    return new MockTxBuilder()
  }
}

class MockTxBuilder {
  // constructor () {}
  toHex () {
    return 'mockTXHex'
  }

  build () {
    return this.toHex
  }
}

const bitboxMock = {
  Mnemonic: {
    generate: sinon.stub().returns({}),
    wordLists: sinon.stub().returns({}),
    toSeed: sinon.stub().returns({})
  },
  HDNode: {
    fromSeed: sinon.stub().returns({}),
    derivePath: sinon.stub().returns({}),
    toCashAddress: sinon.stub().returns({}),
    toLegacyAddress: sinon.stub().returns({}),
    toKeyPair: sinon.stub().returns({}),
    toWIF: sinon.stub().returns({})
  },
  Address: {
    details: sinon.stub().returns(addressDetails),
    utxo: sinon.stub().returns(utxos),
    toLegacyAddress: sinon.stub().returns({})
  },
  TransactionBuilder: mockTransactionBuilder,
  BitcoinCash: {
    getByteCount: sinon.stub().returns(250)
  },
  RawTransactions: {
    sendRawTransaction: sinon.stub().returns('mockTXID')
  },
  ECPair: {
    fromWIF: sinon.stub().returns({}),
    toCashAddress: sinon.stub().returns({}),
    toPublicKey: sinon.stub().returns({})
  },
  Electrumx: {
    transactions: sinon.stub().returns(ElectrumXTransactionsResponse),
    balance: sinon.stub().returns(ElectrumXBalanceResponse)
  },
  SLP: {
    Address: {
      toCashAddress: sinon
        .stub()
        .returns('bchtest:qzsfqeqtdk6plsvglccadkqtf0trf2nyz58090e6tt')
    }
  }
}

module.exports = {
  bitboxMock
}
