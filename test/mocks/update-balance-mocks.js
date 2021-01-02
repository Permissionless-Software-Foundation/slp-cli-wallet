/*
  Mock data for the update-balances command
*/

'use strict'

// Has an address with a balance.
const mockAddressDetails1 = [
  {
    balance: {
      confirmed: 0,
      unconfirmed: 0
    },
    address: 'bitcoincash:qrj5p3j59zg2cqt3pe09vgk6w627y7nnzy3c9ffqg3',
    hdIndex: 0
  },
  {
    balance: {
      confirmed: 6000,
      unconfirmed: 0
    },
    address: 'bitcoincash:qq6mvsm7l92d77zpymmltvaw09p5uzghyuyx7spygg',
    hdIndex: 1
  },
  {
    balance: {
      confirmed: 546,
      unconfirmed: 0
    },
    address: 'bitcoincash:qpjdrs8qruzh8xvusdfmutjx62awcepnhyperm3g89',
    hdIndex: 2
  }
]

// Has no addresses with a balance.
const mockAddressDetails2 = [
  {
    balance: {
      confirmed: 0,
      unconfirmed: 0
    },
    address: 'bitcoincash:qpjf52s7empfpe0ttrfw52l9an9cjrecyup0p9eue3',
    hdIndex: 4
  },
  {
    balance: {
      confirmed: 0,
      unconfirmed: 0
    },
    address: 'bitcoincash:qz2yrnv9avs3wmh47u0c6x0k63509ysfact33fcx73',
    hdIndex: 5
  }
]

const hasBalanceMock = [
  {
    index: 21,
    balance: 0.04997504,
    balanceSat: 4997504,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    cashAddress: 'bchtest:qr2jpphytu94uf9h7ajexvj38awl8c9zdssrg7dklw'
  },
  {
    index: 23,
    balance: 0.04979784,
    balanceSat: 4979784,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    cashAddress: 'bchtest:qrxcug4mv3z20lztfh2j4u9qdyqxhjanestcvg36t5'
  }
]

const mockTokenUtxo = [
  {
    txid: 'c5ba34388b688459a1de02eeffb4e9b0f24eb45203ec90fe44f855686686ca3c',
    vout: 2,
    value: '546',
    height: 601149,
    confirmations: 2274,
    satoshis: 546
  },
  {
    txid: '4588c219dd5842ddce3962d1dfe443b92337fa91d5314ee7792b9cd8dac32075',
    vout: 1,
    value: '546',
    height: 597740,
    confirmations: 5683,
    satoshis: 546
  }
]

const mockElectrumxTokenUtxos = {
  success: true,
  utxos: [
    {
      height: 597740,
      tx_hash:
        '4588c219dd5842ddce3962d1dfe443b92337fa91d5314ee7792b9cd8dac32075',
      tx_pos: 1,
      value: 546
    },
    {
      height: 601149,
      tx_hash:
        'c5ba34388b688459a1de02eeffb4e9b0f24eb45203ec90fe44f855686686ca3c',
      tx_pos: 2,
      value: 546
    }
  ]
}

const mockTokenUtxoDetails = [
  {
    txid: 'c5ba34388b688459a1de02eeffb4e9b0f24eb45203ec90fe44f855686686ca3c',
    vout: 2,
    value: '546',
    height: 601149,
    confirmations: 2274,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'ebd3043ea18b7c004395307d26bbb62b416bf858d07e2717b45194c64a186c03',
    tokenTicker: 'p\u001f\u000e+',
    tokenName: 'bang cash lotto ticket',
    tokenDocumentUrl: 'http://bang.cash/',
    tokenDocumentHash: '',
    decimals: 0,
    tokenQty: 3
  },
  {
    txid: '4588c219dd5842ddce3962d1dfe443b92337fa91d5314ee7792b9cd8dac32075',
    vout: 1,
    value: '546',
    height: 597740,
    confirmations: 5683,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '3b3dbc418af179bfa9832255e9cc4e4bb7abacde8da62881f6eb466cbf70cc66',
    tokenTicker: 'p\u001f\r\u001e',
    tokenName: 'p\u001f\r\u001e',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 0,
    tokenQty: 61769
  }
]

const mockBalancesForAddress = [
  [
    {
      tokenId:
        '3b3dbc418af179bfa9832255e9cc4e4bb7abacde8da62881f6eb466cbf70cc66',
      balance: 61769,
      balanceString: '61769',
      slpAddress: 'simpleledger:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huq2dqlz4h',
      decimalCount: 0
    }
  ]
]

const mockWallet1 = {
  network: 'testnet',
  mnemonic:
    'alert mad wreck salon target later across crater stick mammal grunt ability',
  derivation: 245,
  rootAddress: 'bchtest:qzl37uzel5urphw8dnkerxtlr5mxunvsys062p7g9v',
  balance: 0.00001,
  nextAddress: 3,
  hasBalance: [
    {
      index: 1,
      balance: 0.00001,
      balanceSat: 1000,
      unconfirmedBalance: 0,
      unconfirmedBalanceSat: 0,
      cashAddress: 'bchtest:qzylf04c9f9d20gndgw9dp82602umwzuuqhnxv7jmn'
    }
  ],
  name: 'temp',
  balanceConfirmed: 0.00001,
  balanceUnconfirmed: 0,
  SLPUtxos: [],
  addresses: [
    [0, 'bchtest:qzl37uzel5urphw8dnkerxtlr5mxunvsys062p7g9v'],
    [1, 'bchtest:qzylf04c9f9d20gndgw9dp82602umwzuuqhnxv7jmn'],
    [2, 'bchtest:qp6dyeslwkslzruaf29vvtv6lg7lez8csca90lg6a0'],
    [3, 'bchtest:qqkng037s5pjhhk38mkaa3c6grl3uep845evtxvyse']
  ]
}

const mockWallet2 = {
  network: 'mainnet',
  mnemonic:
    'hero tunnel various dignity harvest equal weekend manage drastic theme bamboo cause',
  derivation: 245,
  rootAddress: 'bitcoincash:qrj5p3j59zg2cqt3pe09vgk6w627y7nnzy3c9ffqg3',
  balance: 0.00014091,
  nextAddress: 4,
  hasBalance: [],
  addresses: [],
  name: 'temp',
  balanceConfirmed: 0,
  balanceUnconfirmed: 0.00014091,
  SLPUtxos: []
}

const mockAddressData = [
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qp4s6fdzv65e2vwvdhjkgggj625y6l35v52sslcv68',
    balance: '0',
    totalReceived: '10000',
    totalSent: '10000',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 2,
    txids: [
      '38766e564484273747c69b3a4960dfad5e27f5f79ce089a2f82eea3d82a0d409',
      '0e89a5fe5ff681ea4bec23d5f98b4cf8e2de3e513c5bf4888cadaca94be15b2b'
    ]
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qrv7hpra544w4plygz0n02fkwnd66hx38s700f04vu',
    balance: '0',
    totalReceived: '546',
    totalSent: '546',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 2,
    txids: [
      '38766e564484273747c69b3a4960dfad5e27f5f79ce089a2f82eea3d82a0d409',
      'a72181f3251ea65a1c210760428abf19479ff75a42b2dae5a51e2b1b680aa797'
    ]
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qrdyey78fa6wfqnwrwjm0fylrd2f29psz5fa45966p',
    balance: '0',
    totalReceived: '554864',
    totalSent: '554864',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 4,
    txids: [
      'cd71863fda794b175a6eadc8945d3a72bfb44e3ae64a4016da416bc59e94b78e',
      '122cda3724b1653a053cdfac796043ceed0950192e21a8ddd9ffe02b5ad6c84f',
      'ff802973ce72a230cc1eeee81f077025f79318853c5e9f59483f48400905a485',
      'acf42e22f1401350567dc4d393c0b6398bc9f0ec6cab9616acfaec9aea8aa95f'
    ]
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qqud4qxa0hay6xjq3ckwnc63vpthap5cnywmtdu7ak',
    balance: '0',
    totalReceived: '454070',
    totalSent: '454070',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 2,
    txids: [
      'b322e3f54949ca9958ac842e1dbb6bd95f6ea7ea8e935aa7a9b3e6b84a3bee91',
      'ff802973ce72a230cc1eeee81f077025f79318853c5e9f59483f48400905a485'
    ]
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qqn6ckg0gvkfhsf6ypupv7dk4vrdxd46qvanuvu29q',
    balance: '403822',
    totalReceived: '403822',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 1,
    txids: ['b322e3f54949ca9958ac842e1dbb6bd95f6ea7ea8e935aa7a9b3e6b84a3bee91']
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qpdnyz5ztzd77mn4c7cxs0z4fmk0pvlhusc39kggmj',
    balance: '0',
    totalReceived: '8408',
    totalSent: '8408',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 2,
    txids: [
      'cd71863fda794b175a6eadc8945d3a72bfb44e3ae64a4016da416bc59e94b78e',
      '38766e564484273747c69b3a4960dfad5e27f5f79ce089a2f82eea3d82a0d409'
    ]
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qqknp6ql4nh7xmlrg89aa3v94fq8m0f7tscp37ptxe',
    balance: '0',
    totalReceived: '6816',
    totalSent: '6816',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 2,
    txids: [
      '1523e7c28821b48b92fb578c3f6c4faefd96960c97c6a07eeb2c46e5a91f8b74',
      'cd71863fda794b175a6eadc8945d3a72bfb44e3ae64a4016da416bc59e94b78e'
    ]
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qz20l7f32j5wmwm9zmr6mey24fjrfaxu2smat42hr8',
    balance: '0',
    totalReceived: '546',
    totalSent: '546',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 2,
    txids: [
      '1523e7c28821b48b92fb578c3f6c4faefd96960c97c6a07eeb2c46e5a91f8b74',
      '1699d43a78e248e7c51de0341f3242247c2ec27321628640812dd4317c41888f'
    ]
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qrd2w4xc6aj6l47qf768vactc4vna3htv5ljkkgk8q',
    balance: '5224',
    totalReceived: '5224',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 1,
    txids: ['1523e7c28821b48b92fb578c3f6c4faefd96960c97c6a07eeb2c46e5a91f8b74']
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qqxqx6s7uxqvjk8e0ta94znzw245wzglh5h9wdssan',
    balance: '546',
    totalReceived: '546',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 1,
    txids: ['9dbaaafc48c49a21beabada8de632009288a2cd52eecefd0c00edcffca9955d0']
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bitcoincash:qraqu7zmu5pt6xfqxey0f4fm8fe27s8q7cgd90x0p5',
    balance: '0',
    totalReceived: '0',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 0
  }
]
const mockSlpUtxoData = [
  {
    txid: '9dbaaafc48c49a21beabada8de632009288a2cd52eecefd0c00edcffca9955d0',
    vout: 1,
    value: '546',
    height: 600711,
    confirmations: 2876,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '7353603832726dc0bd67afaac2acdd0fbd9fbe562710a68fd1e88943211277fc',
    tokenTicker: 'SLPDEMO',
    tokenName: 'SLP Demo token',
    tokenDocumentUrl: 'developer.bitcoin.com',
    tokenDocumentHash: '',
    decimals: 0,
    tokenQty: 202,
    cashAddr: 'bitcoincash:qqxqx6s7uxqvjk8e0ta94znzw245wzglh5h9wdssan',
    slpAddr: 'simpleledger:qqxqx6s7uxqvjk8e0ta94znzw245wzglh5m79k9srd'
  }
]

const mockUtxosWithMintingBaton = [
  {
    address: 'bitcoincash:qpan6clgy8vjkv8anz683phflsacrtx3xqvksf5569',
    utxos: [
      {
        height: 668448,
        tx_hash:
          '60993abdac4016f86a2df03d96e994640880f064a84e59501349319a3a12cb49',
        tx_pos: 2,
        value: 546,
        satoshis: 546,
        txid:
          '60993abdac4016f86a2df03d96e994640880f064a84e59501349319a3a12cb49',
        vout: 2,
        utxoType: 'token',
        transactionType: 'send',
        tokenId:
          'd1c16867b41d77e6196e2680173b3afc9dff1968118ad1b829b3c8b9b921328d',
        tokenTicker: 'SLPTEST',
        tokenName: 'SLP Test Token',
        tokenDocumentUrl: 'https://FullStack.cash',
        tokenDocumentHash: '',
        decimals: 8,
        tokenType: 1,
        tokenQty: 99,
        isValid: true,
        address: 'bitcoincash:qpan6clgy8vjkv8anz683phflsacrtx3xqvksf5569',
        hdIndex: 0
      },
      {
        height: 668448,
        tx_hash:
          'd1c16867b41d77e6196e2680173b3afc9dff1968118ad1b829b3c8b9b921328d',
        tx_pos: 2,
        value: 546,
        satoshis: 546,
        txid:
          'd1c16867b41d77e6196e2680173b3afc9dff1968118ad1b829b3c8b9b921328d',
        vout: 2,
        utxoType: 'minting-baton',
        tokenId:
          'd1c16867b41d77e6196e2680173b3afc9dff1968118ad1b829b3c8b9b921328d',
        tokenTicker: 'SLPTEST',
        tokenName: 'SLP Test Token',
        tokenDocumentUrl: 'https://FullStack.cash',
        tokenDocumentHash: '',
        decimals: 8,
        tokenType: 1,
        isValid: true,
        address: 'bitcoincash:qpan6clgy8vjkv8anz683phflsacrtx3xqvksf5569',
        hdIndex: 0
      }
    ]
  }
]

module.exports = {
  mockAddressDetails1,
  mockAddressDetails2,
  hasBalanceMock,
  mockTokenUtxo,
  mockTokenUtxoDetails,
  mockBalancesForAddress,
  mockWallet1,
  mockWallet2,
  mockAddressData,
  mockSlpUtxoData,
  mockElectrumxTokenUtxos,
  mockUtxosWithMintingBaton
}
