/*
  Mocks for unit tests for the sweep command
*/

'use strict'

// Blockbook
const mockBalance1 = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qqtc3vqfzz050jkvcfjvtzj392lf6wlqhun3fw66n9',
  balance: '1000',
  totalReceived: '1000',
  totalSent: '0',
  unconfirmedBalance: '0',
  unconfirmedTxs: 0,
  txs: 1,
  txids: ['406b9f2282fca16e1e3cb2bab02d50aacb26511b6b1becd95c81f24161b768a3']
}

// Electrumx
const mockBalance2 = {
  success: true,
  balance: {
    confirmed: 1000,
    unconfirmed: 0
  }
}

const mockEmptyUtxos = {
  success: true,
  utxos: []
}

const tokenOnlyUtxos = {
  success: true,
  utxos: [
    {
      height: 0,
      tx_hash:
        '9aee3be4c22d98234eacd72d3b2e91206c038264e9dbaac6fe13eafbc5c956aa',
      tx_pos: 1,
      value: 546
    }
  ]
}

const tokenOnlyTokenInfo = [
  {
    height: 0,
    tx_hash: '9aee3be4c22d98234eacd72d3b2e91206c038264e9dbaac6fe13eafbc5c956aa',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: '9aee3be4c22d98234eacd72d3b2e91206c038264e9dbaac6fe13eafbc5c956aa',
    vout: 1,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '6201f3efe486c577433622817b99645e1d473cd3882378f9a0efc128ab839a82',
    tokenTicker: 'VALENTINE',
    tokenName: 'Valentine day token',
    tokenDocumentUrl: 'fullstack.cash',
    tokenDocumentHash: '',
    decimals: 2,
    tokenType: 1,
    tokenQty: '1',
    isValid: true
  }
]

const bchOnlyUtxos = {
  success: true,
  utxos: [
    {
      height: 0,
      tx_hash:
        '8a5dff4a67d8fc0fac531146a79ed359480fba59ba50edba372f4f97e291ca10',
      tx_pos: 0,
      value: 8432
    }
  ]
}

const bchSmallUtxos = [
  {
    txid: '53c9ee6e5ecec2787d2edfeaf0b192b45a937d5a4b1eaa715545eeb3c5c67ede',
    vout: 0,
    value: '550',
    height: 603853,
    confirmations: 17,
    satoshis: 550
  }
]

const bchOnlyTokenInfo = [
  {
    height: 0,
    tx_hash: '8a5dff4a67d8fc0fac531146a79ed359480fba59ba50edba372f4f97e291ca10',
    tx_pos: 0,
    value: 8432,
    satoshis: 8432,
    txid: '8a5dff4a67d8fc0fac531146a79ed359480fba59ba50edba372f4f97e291ca10',
    vout: 0,
    isValid: false
  }
]

// Contains both a token and non-token utxo.
const bothUtxos = {
  success: true,
  utxos: [
    {
      height: 0,
      tx_hash:
        '8a5dff4a67d8fc0fac531146a79ed359480fba59ba50edba372f4f97e291ca10',
      tx_pos: 0,
      value: 8432
    },
    {
      height: 0,
      tx_hash:
        'd6759c4e3499476af61012e37573bf9cb1db5258f92d8a3f190cb3e590ae9659',
      tx_pos: 1,
      value: 546
    }
  ]
}

// Contains both a token and non-token UTXO.
const bothTokenInfo = [
  {
    height: 0,
    tx_hash: '8a5dff4a67d8fc0fac531146a79ed359480fba59ba50edba372f4f97e291ca10',
    tx_pos: 0,
    value: 8432,
    satoshis: 8432,
    txid: '8a5dff4a67d8fc0fac531146a79ed359480fba59ba50edba372f4f97e291ca10',
    vout: 0,
    isValid: false
  },
  {
    height: 0,
    tx_hash: 'd6759c4e3499476af61012e37573bf9cb1db5258f92d8a3f190cb3e590ae9659',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: 'd6759c4e3499476af61012e37573bf9cb1db5258f92d8a3f190cb3e590ae9659',
    vout: 1,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '6201f3efe486c577433622817b99645e1d473cd3882378f9a0efc128ab839a82',
    tokenTicker: 'VALENTINE',
    tokenName: 'Valentine day token',
    tokenDocumentUrl: 'fullstack.cash',
    tokenDocumentHash: '',
    decimals: 2,
    tokenType: 1,
    tokenQty: '1',
    isValid: true
  }
]

const bchUtxo = [
  {
    txid: '71de89aeeb935311847696e410a7456eef807e8c3dc87d7a13b3da84baf4c485',
    vout: 0,
    value: '2000',
    height: 603753,
    confirmations: 145,
    satoshis: 2000
  }
]

const twoTokens = [
  {
    txid: '410fa835c5409497954a5819f7eca577d429fc1606eb29107125c2372286bf1b',
    vout: 1,
    value: '546',
    confirmations: 0,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
    tokenTicker: 'TOK-CH',
    tokenName: 'TokyoCash',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 8,
    tokenQty: 1
  },
  {
    txid: '551d9e9ee4a40a3b42a96dde8a41a5b48c849f0ea72ee525b839f1f1140575cb',
    vout: 1,
    value: '546',
    height: 603753,
    confirmations: 283,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'dd84ca78db4d617221b58eabc6667af8fe2f7eadbfcc213d35be9f1b419beb8d',
    tokenTicker: 'TAP',
    tokenName: 'Thoughts and Prayers',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 0,
    tokenQty: 1
  }
]

module.exports = {
  mockBalance1,
  mockBalance2,
  mockEmptyUtxos,
  tokenOnlyUtxos,
  tokenOnlyTokenInfo,
  bchOnlyUtxos,
  bchOnlyTokenInfo,
  bothUtxos,
  bothTokenInfo,
  bchUtxo,
  twoTokens,
  bchSmallUtxos
}
