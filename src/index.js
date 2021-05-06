import MetaMaskOnboarding from '@metamask/onboarding'
// eslint-disable-next-line camelcase
import { encrypt, recoverPersonalSignature, recoverTypedSignatureLegacy, recoverTypedSignature, recoverTypedSignature_v4 } from 'eth-sig-util'
import { ethers } from 'ethers'
import { providers, utils } from '@starcoin/starcoin'
import { toChecksumAddress } from 'ethereumjs-util'
import BigNumber from 'bignumber.js'
import { hstBytecode, hstAbi, piggybankBytecode, piggybankAbi } from './constants.json'

// Big Number Constants
const BIG_NUMBER_NANO_STC_MULTIPLIER = new BigNumber('1000000000')
const BIG_NUMBER_STC_MULTIPLIER = new BigNumber('1')

const toNormalizedDenomination = {
  NanoSTC: (bigNumber) => bigNumber.div(BIG_NUMBER_NANO_STC_MULTIPLIER),
  STC: (bigNumber) => bigNumber.div(BIG_NUMBER_STC_MULTIPLIER),
}

const toSpecifiedDenomination = {
  NanoSTC: (bigNumber) => bigNumber.times(BIG_NUMBER_NANO_STC_MULTIPLIER).round(9),
  STC: (bigNumber) => bigNumber.times(BIG_NUMBER_STC_MULTIPLIER).round(9),
}

let ethersProvider
let starcoinProvider
let hstFactory
let piggybankFactory
let nodeURL
let isNodeConnected

const currentUrl = new URL(window.location.href)
const forwarderOrigin = currentUrl.hostname === 'localhost'
  ? 'http://localhost:9010'
  : undefined

// const { isMetaMaskInstalled } = MetaMaskOnboarding
const isMetaMaskInstalled = () => { return true }

// Node URL Section
const connectNodeButton = document.getElementById('connectNodeButton')

// Dapp Status Section
const networkDiv = document.getElementById('network')
const chainIdDiv = document.getElementById('chainId')
const latestBlockDiv = document.getElementById('latestBlock')
// const accountsDiv = document.getElementById('accounts')
const accountBalanceDiv = document.getElementById('accountBalanceResult')

// Basic Actions Section
// const onboardButton = document.getElementById('connectButton')
const getAccountsButton = document.getElementById('getAccounts')
const getAccountsResults = document.getElementById('getAccountsResult')

// Permissions Actions Section
/*
const requestPermissionsButton = document.getElementById('requestPermissions')
const getPermissionsButton = document.getElementById('getPermissions')
const permissionsResult = document.getElementById('permissionsResult')
*/

// Account Actions Section
const getBalanceButton = document.getElementById('getBalanceButton')

// Contract Section
const executeContractButton = document.getElementById('executeContractButton')
/*
const deployButton = document.getElementById('deployButton')
const depositButton = document.getElementById('depositButton')
const withdrawButton = document.getElementById('withdrawButton')
*/
const contractStatus = document.getElementById('contractStatus')

// Send Eth Section
// const sendButton = document.getElementById('sendButton')
const sendSTCButton = document.getElementById('sendSTCButton')
const sendSTCStatus = document.getElementById('sendSTCStatus')

// Sign Message Section
const signMessageButton = document.getElementById('signMessageButton')
const signMessageStatus = document.getElementById('signMessageStatus')

// Send Tokens Section
const tokenAddress = document.getElementById('tokenAddress')
const createToken = document.getElementById('createToken')
const transferTokens = document.getElementById('transferTokens')
const approveTokens = document.getElementById('approveTokens')
const transferTokensWithoutGas = document.getElementById('transferTokensWithoutGas')
const approveTokensWithoutGas = document.getElementById('approveTokensWithoutGas')

// Encrypt / Decrypt Section
const getEncryptionKeyButton = document.getElementById('getEncryptionKeyButton')
const encryptMessageInput = document.getElementById('encryptMessageInput')
const encryptButton = document.getElementById('encryptButton')
const decryptButton = document.getElementById('decryptButton')
const encryptionKeyDisplay = document.getElementById('encryptionKeyDisplay')
const ciphertextDisplay = document.getElementById('ciphertextDisplay')
const cleartextDisplay = document.getElementById('cleartextDisplay')

// Ethereum Signature Section
const ethSign = document.getElementById('ethSign')
const ethSignResult = document.getElementById('ethSignResult')
const personalSign = document.getElementById('personalSign')
const personalSignResult = document.getElementById('personalSignResult')
const personalSignVerify = document.getElementById('personalSignVerify')
const personalSignVerifySigUtilResult = document.getElementById('personalSignVerifySigUtilResult')
const personalSignVerifyECRecoverResult = document.getElementById('personalSignVerifyECRecoverResult')
const signTypedData = document.getElementById('signTypedData')
const signTypedDataResult = document.getElementById('signTypedDataResult')
const signTypedDataVerify = document.getElementById('signTypedDataVerify')
const signTypedDataVerifyResult = document.getElementById('signTypedDataVerifyResult')
const signTypedDataV3 = document.getElementById('signTypedDataV3')
const signTypedDataV3Result = document.getElementById('signTypedDataV3Result')
const signTypedDataV3Verify = document.getElementById('signTypedDataV3Verify')
const signTypedDataV3VerifyResult = document.getElementById('signTypedDataV3VerifyResult')
const signTypedDataV4 = document.getElementById('signTypedDataV4')
const signTypedDataV4Result = document.getElementById('signTypedDataV4Result')
const signTypedDataV4Verify = document.getElementById('signTypedDataV4Verify')
const signTypedDataV4VerifyResult = document.getElementById('signTypedDataV4VerifyResult')

// Miscellaneous
const addEthereumChain = document.getElementById('addEthereumChain')

const initialize = async (nodeURL) => {
  try {
    // We must specify the network as 'any' for ethers to allow network changes
    /*
    ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    hstFactory = new ethers.ContractFactory(
      hstAbi,
      hstBytecode,
      ethersProvider.getSigner(),
    )
    piggybankFactory = new ethers.ContractFactory(
      piggybankAbi,
      piggybankBytecode,
      ethersProvider.getSigner(),
    )
    */
    // Starcoin network
    // const nodeURL = "http://barnard.seed.starcoin.org:9850"
    starcoinProvider = new providers.JsonrpcProvider(nodeURL);
    console.log('initialized provider')
  } catch (error) {
    console.error(error)
  }

  let onboarding
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin })
  } catch (error) {
    console.error(error)
  }

  let accounts
  let accountButtonsInitialized = false

  const accountButtons = [
    // deployButton,
    executeContractButton,
    signMessageButton,
    // depositButton,
    // withdrawButton,
    // sendButton,
    getBalanceButton,
    sendSTCButton,
    createToken,
    transferTokens,
    approveTokens,
    transferTokensWithoutGas,
    approveTokensWithoutGas,
    getEncryptionKeyButton,
    encryptMessageInput,
    encryptButton,
    decryptButton,
    ethSign,
    personalSign,
    personalSignVerify,
    signTypedData,
    signTypedDataVerify,
    signTypedDataV3,
    signTypedDataV3Verify,
    signTypedDataV4,
    signTypedDataV4Verify,
  ]

  // const isMetaMaskConnected = () => accounts && accounts.length > 0
  const isMetaMaskConnected = () => { return false }

  const onClickInstall = () => {
    /*
    onboardButton.innerText = 'Onboarding in progress'
    onboardButton.disabled = true
    */
    onboarding.startOnboarding()
  }

  const onClickConnectNode = async () => {
    try {
      let inputNodeURL = document.getElementById('nodeURLInput').value
      nodeURL = inputNodeURL
      console.log({ nodeURL })
      handleNodeURL(nodeURL)
      isNodeConnected = true
    } catch (error) {
      console.error(error)
    }
  }

  connectNodeButton.onclick = onClickConnectNode

  const onClickConnect = async () => {
    try {
      const newAccounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      // handleNewAccounts(newAccounts)
    } catch (error) {
      console.error(error)
    }
  }

  getAccountsButton.onclick = async () => {
    try {
      /*
      const _accounts = await ethereum.request({
        method: 'eth_accounts',
      })
      */
      const _accounts = await starcoinProvider.listAccounts()
      accounts = _accounts
      let template = "<li class=\"list-group-item\">~item~</li>";
      _accounts.forEach(function (account) {
        getAccountsResults.insertAdjacentHTML("beforeend", template.replace(/~item~/g, account));
      })
    } catch (err) {
      console.error(err)
      getAccountsResults.innerHTML = `Error: ${err.message}`
    }
  }


  const clearTextDisplays = () => {
    encryptionKeyDisplay.innerText = ''
    encryptMessageInput.value = ''
    ciphertextDisplay.innerText = ''
    cleartextDisplay.innerText = ''
  }

  const updateButtons = () => {
    const accountButtonsDisabled = !isMetaMaskInstalled() || !isMetaMaskConnected()
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
        button.disabled = true
      }
      clearTextDisplays()
    } else {
      // deployButton.disabled = false
      executeContractButton.disabled = false
      signMessageButton.disabled = false
      // sendButton.disabled = false
      getBalanceButton.disabled = false
      sendSTCButton.disabled = false
      createToken.disabled = false
      personalSign.disabled = false
      signTypedData.disabled = false
      getEncryptionKeyButton.disabled = false
      ethSign.disabled = false
      personalSign.disabled = false
      signTypedData.disabled = false
      signTypedDataV3.disabled = false
      signTypedDataV4.disabled = false
    }

    if (isMetaMaskInstalled()) {
      addEthereumChain.disabled = false
    } else {
      /*
      onboardButton.innerText = 'Click here to install MetaMask!'
      onboardButton.onclick = onClickInstall
      onboardButton.disabled = false
      */
    }

    if (isMetaMaskConnected()) {
      /*
      onboardButton.innerText = 'Connected'
      onboardButton.disabled = true
      */
      if (onboarding) {
        onboarding.stopOnboarding()
      }
    } else {
      /*
      onboardButton.innerText = 'Connect'
      onboardButton.onclick = onClickConnect
      onboardButton.disabled = false
      */
    }
  }

  addEthereumChain.onclick = async () => {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x64',
        rpcUrls: ['https://dai.poa.network'],
        chainName: 'xDAI Chain',
        nativeCurrency: { name: 'xDAI', decimals: 18, symbol: 'xDAI' },
        blockExplorerUrls: ['https://blockscout.com/poa/xdai'],
      }],
    })
  }

  const initializeAccountButtons = () => {

    if (accountButtonsInitialized) {
      return
    }
    accountButtonsInitialized = true

    /**
     * Contract Interactions
     */
    executeContractButton.onclick = async () => {
      console.log('execute contract button clicked')
      let contract
      contractStatus.innerHTML = 'Executing'
      const contractSignerAddress = document.getElementById('contractSignerInput').value
      const contractCode = document.getElementById('contractCodeInput').value
      const typeArgumentsInput = document.getElementById('typeArgumentsInput').value
      const typeArguments = typeArgumentsInput === '' ? [] : typeArgumentsInput.split(',')
      const functionArgumentsInput = document.getElementById('functionArgumentsInput').value
      const functionArguments = functionArgumentsInput === '' ? [] : functionArgumentsInput.split(',')
      const contractSignerPassword = document.getElementById('contractSignerPasswordInput').value
      const signer = await starcoinProvider.getSigner(contractSignerAddress)
      await signer.unlock(contractSignerPassword)
      const txnRequest = {
        script: {
          code: contractCode,
          type_args: typeArguments,
          args: functionArguments,
        }
      }
      console.log({ txnRequest })

      let txnInfo

      try {
        const txnDryRunOutput = await starcoinProvider.dryRun(txnRequest)
        console.log({ txnDryRunOutput })

        const txn = await signer.sendTransaction(txnRequest)
        console.log({ txn })

        txnInfo = await txn.wait(1)
        console.log({ txnInfo })
        /*
        contract = await piggybankFactory.deploy()
        await contract.deployTransaction.wait()
        */
      } catch (error) {
        contractStatus.innerHTML = 'Contract Execution Failed'
        throw error
      }


      /*
      if (contractSignerAddress === undefined) {
        return
      }
      */

      // console.log(`Contract executed! address: ${contract.address} transactionHash: ${contract.transactionHash}`)
      console.log(`Contract executed! TransactionInfo: ${txnInfo}`)
      contractStatus.innerHTML = `Contract executed! Transaction Hash: ${txnInfo.transaction_hash}`
      // depositButton.disabled = false
      // withdrawButton.disabled = false

      /*
      depositButton.onclick = async () => {
        contractStatus.innerHTML = 'Deposit initiated'
        const result = await contract.deposit({
          from: accounts[0],
          value: '0x3782dace9d900000',
        })
        console.log(result)
        contractStatus.innerHTML = 'Deposit completed'
      }

      withdrawButton.onclick = async () => {
        const result = await contract.withdraw(
          '0xde0b6b3a7640000',
          { from: accounts[0] },
        )
        console.log(result)
        contractStatus.innerHTML = 'Withdrawn'
      }
      */

      console.log('Contract execution ended')
    }

    /*
    deployButton.onclick = async () => {
      let contract
      contractStatus.innerHTML = 'Deploying'

      try {
        contract = await piggybankFactory.deploy()
        await contract.deployTransaction.wait()
      } catch (error) {
        contractStatus.innerHTML = 'Deployment Failed'
        throw error
      }

      if (contract.address === undefined) {
        return
      }

      console.log(`Contract mined! address: ${contract.address} transactionHash: ${contract.transactionHash}`)
      contractStatus.innerHTML = 'Deployed'
      depositButton.disabled = false
      withdrawButton.disabled = false

      depositButton.onclick = async () => {
        contractStatus.innerHTML = 'Deposit initiated'
        const result = await contract.deposit({
          from: accounts[0],
          value: '0x3782dace9d900000',
        })
        console.log(result)
        contractStatus.innerHTML = 'Deposit completed'
      }

      withdrawButton.onclick = async () => {
        const result = await contract.withdraw(
          '0xde0b6b3a7640000',
          { from: accounts[0] },
        )
        console.log(result)
        contractStatus.innerHTML = 'Withdrawn'
      }

      console.log(contract)
    }
    */

    /**
     * Sign Message
    */

    signMessageButton.onclick = async () => {
      console.log('sign message button clicked')
      let signedMessage
      signMessageStatus.innerHTML = 'Signing Message....'
      const messageSignerAddress = document.getElementById('messageSignerInput').value
      const messageInput = document.getElementById('signMessageInput').value
      const messageSignerPassword = document.getElementById('messageSignerPasswordInput').value

      try {
        const signer = await starcoinProvider.getSigner(messageSignerAddress)
        await signer.unlock(messageSignerPassword)
        signedMessage = await signer.signMessage(messageInput);
        console.log({ signedMessage })
        signMessageStatus.innerHTML = `Signed Successfully. Signed Message Output: ${signedMessage}`
      } catch (error) {
        signMessageStatus.innerHTML = 'Message Signing Failed'
        throw error
      }


      /*
      if (contractSignerAddress === undefined) {
        return
      }
      */

      // console.log(`Contract executed! address: ${contract.address} transactionHash: ${contract.transactionHash}`)
      // depositButton.disabled = false
      // withdrawButton.disabled = false

      /*
      depositButton.onclick = async () => {
        contractStatus.innerHTML = 'Deposit initiated'
        const result = await contract.deposit({
          from: accounts[0],
          value: '0x3782dace9d900000',
        })
        console.log(result)
        contractStatus.innerHTML = 'Deposit completed'
      }

      withdrawButton.onclick = async () => {
        const result = await contract.withdraw(
          '0xde0b6b3a7640000',
          { from: accounts[0] },
        )
        console.log(result)
        contractStatus.innerHTML = 'Withdrawn'
      }
      */

      console.log('sign message ended')
    }

    /**
     * Sending ETH
     */

    /*
    sendButton.onclick = async () => {
      const result = await ethersProvider.getSigner().sendTransaction({
        to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        value: '0x29a2241af62c0000',
        gasLimit: 21000,
        gasPrice: 20000000000,
      })
      console.log(result)
    }
    */
    getBalanceButton.onclick = async () => {
      console.log('get balance button clicked')
      const accountAddress = document.getElementById('accountAddressInput').value
      console.log({ accountAddress })
      const balance = await starcoinProvider.getBalance(accountAddress) || 0
      console.log({ balance })
      let convertedValue = toNormalizedDenomination['NanoSTC'](new BigNumber(balance, 10))
      convertedValue = toSpecifiedDenomination['STC'](convertedValue)
      convertedValue = convertedValue.round(9, BigNumber.ROUND_HALF_DOWN)
      accountBalanceResult.innerText = convertedValue
      /*
      if (balanceBefore !== undefined) {
        // @ts-ignore
        const diff = balance - balanceBefore;
        expect(diff).toBe(100000);
      } else {
        expect(balance).toBe(100000);
      }
      */
    }

    sendSTCButton.onclick = async () => {
      /*
      const result = await starcoinProvider.getSigner().sendTransaction({
        to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        value: '0x29a2241af62c0000',
        gasLimit: 21000,
        gasPrice: 20000000000,
      })
      console.log(result)
      */
      console.log('send stc button clicked')
      const fromAccount = document.getElementById('fromAccountInput').value
      const toAccount = document.getElementById('toAccountInput').value
      const sendAmount = parseInt(document.getElementById('amountInput').value, 10)
      const sendAmountString = `${sendAmount.toString()}u128`
      console.log({ sendAmountString })
      const senderPrivateKeyHex = document.getElementById('senderPrivateKeyHexInput').value
      console.log({ senderPrivateKeyHex })

      const txnRequest = {
        script: {
          code: '0x1::TransferScripts::peer_to_peer',
          type_args: ['0x1::STC::STC'],
          args: [toAccount, 'x""', sendAmountString],
        }
      }
      console.log({ txnRequest })
      const txnOutput = await starcoinProvider.dryRun(txnRequest)
      console.log({ txnOutput })
      sendSTCStatus.innerText = "Sending STC..."

      const balanceBefore = await starcoinProvider.getBalance(toAccount)
      console.log({ balanceBefore })

      const senderSequenceNumber = await starcoinProvider.getSequenceNumber(fromAccount)

      // TODO: generate maxGasAmount from contract.dry_run -> gas_used
      const maxGasAmount = 124191

      // because the time system in dev network is relatively static, 
      // we should use nodeInfo.now_seconds instead of using new Date().getTime()
      const nowSeconds = await starcoinProvider.getNowSeconds()
      // expired after 12 hours since Unix Epoch
      const expirationTimestampSecs = nowSeconds + 43200

      const chainId = parseInt(chainIdDiv.innerHTML, 10)
      const rawUserTransaction = utils.tx.generateRawUserTransaction(
        fromAccount,
        toAccount,
        sendAmount,
        maxGasAmount,
        senderSequenceNumber,
        expirationTimestampSecs,
        chainId,
      )

      const hex = await utils.tx.signRawUserTransaction(
        senderPrivateKeyHex,
        rawUserTransaction,
      )
      console.log(hex)

      const txn = await starcoinProvider.sendTransaction(hex)
      console.log({ 'sendTransactionOutput': txn })


      const txnInfo = await txn.wait(1)
      console.log({ txnInfo })

      sendSTCStatus.innerText = 'Transaction Completed'

      const balance = await starcoinProvider.getBalance(toAccount)
      console.log({ balance })

      /*
      if (balanceBefore !== undefined) {
        // @ts-ignore
        const diff = balance - balanceBefore;
        expect(diff).toBe(100000);
      } else {
        expect(balance).toBe(100000);
      }
      */
    }

    /**
     * ERC20 Token
     */

    createToken.onclick = async () => {
      const _initialAmount = 100
      const _tokenName = 'TST'
      const _decimalUnits = 0
      const _tokenSymbol = 'TST'

      try {
        const contract = await hstFactory.deploy(
          _initialAmount,
          _tokenName,
          _decimalUnits,
          _tokenSymbol,
        )
        await contract.deployTransaction.wait()
        if (contract.address === undefined) {
          return undefined
        }

        console.log(`Contract mined! address: ${contract.address} transactionHash: ${contract.transactionHash}`)
        tokenAddress.innerHTML = contract.address
        transferTokens.disabled = false
        approveTokens.disabled = false
        transferTokensWithoutGas.disabled = false
        approveTokensWithoutGas.disabled = false

        transferTokens.onclick = async () => {
          const result = await contract.transfer('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '15000', {
            from: accounts[0],
            gasLimit: 60000,
            gasPrice: '20000000000',
          })
          console.log('result', result)
        }

        approveTokens.onclick = async () => {
          const result = await contract.approve('0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4', '70000', {
            from: accounts[0],
            gasLimit: 60000,
            gasPrice: '20000000000',
          })
          console.log(result)
        }

        transferTokensWithoutGas.onclick = async () => {
          const result = await contract.transfer('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '15000', {
            gasPrice: '20000000000',
          })
          console.log('result', result)
        }

        approveTokensWithoutGas.onclick = async () => {
          const result = await contract.approve('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '70000', {
            gasPrice: '20000000000',
          })
          console.log(result)
        }

        return contract
      } catch (error) {
        tokenAddress.innerHTML = 'Creation Failed'
        throw error
      }
    }

    /**
     * Permissions
     */

    /*
    requestPermissionsButton.onclick = async () => {
      try {
        const permissionsArray = await ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        })
        permissionsResult.innerHTML = getPermissionsDisplayString(permissionsArray)
      } catch (err) {
        console.error(err)
        permissionsResult.innerHTML = `Error: ${err.message}`
      }
    }

    getPermissionsButton.onclick = async () => {
      try {
        const permissionsArray = await ethereum.request({
          method: 'wallet_getPermissions',
        })
        permissionsResult.innerHTML = getPermissionsDisplayString(permissionsArray)
      } catch (err) {
        console.error(err)
        permissionsResult.innerHTML = `Error: ${err.message}`
      }
    }
    */


    /**
     * Encrypt / Decrypt
     */

    getEncryptionKeyButton.onclick = async () => {
      try {
        encryptionKeyDisplay.innerText = await ethereum.request({
          method: 'eth_getEncryptionPublicKey',
          params: [accounts[0]],
        })
        encryptMessageInput.disabled = false
      } catch (error) {
        encryptionKeyDisplay.innerText = `Error: ${error.message}`
        encryptMessageInput.disabled = true
        encryptButton.disabled = true
        decryptButton.disabled = true
      }
    }

    encryptMessageInput.onkeyup = () => {
      if (
        !getEncryptionKeyButton.disabled &&
        encryptMessageInput.value.length > 0
      ) {
        if (encryptButton.disabled) {
          encryptButton.disabled = false
        }
      } else if (!encryptButton.disabled) {
        encryptButton.disabled = true
      }
    }

    encryptButton.onclick = () => {
      try {
        ciphertextDisplay.innerText = stringifiableToHex(encrypt(
          encryptionKeyDisplay.innerText,
          { 'data': encryptMessageInput.value },
          'x25519-xsalsa20-poly1305',
        ))
        decryptButton.disabled = false
      } catch (error) {
        ciphertextDisplay.innerText = `Error: ${error.message}`
        decryptButton.disabled = true
      }
    }

    decryptButton.onclick = async () => {
      try {
        cleartextDisplay.innerText = await ethereum.request({
          method: 'eth_decrypt',
          params: [ciphertextDisplay.innerText, ethereum.selectedAddress],
        })
      } catch (error) {
        cleartextDisplay.innerText = `Error: ${error.message}`
      }
    }
  }

  /**
   * eth_sign
   */
  ethSign.onclick = async () => {
    try {
      // const msg = 'Sample message to hash for signature'
      // const msgHash = keccak256(msg)
      const msg = '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0'
      const ethResult = await ethereum.request({
        method: 'eth_sign',
        params: [accounts[0], msg],
      })
      ethSignResult.innerHTML = JSON.stringify(ethResult)
    } catch (err) {
      console.error(err)
      ethSign.innerHTML = `Error: ${err.message}`
    }
  }

  /**
   * Personal Sign
   */
  personalSign.onclick = async () => {
    const exampleMessage = 'Example `personal_sign` message'
    try {
      const from = accounts[0]
      const msg = `0x${Buffer.from(exampleMessage, 'utf8').toString('hex')}`
      const sign = await ethereum.request({
        method: 'personal_sign',
        params: [msg, from, 'Example password'],
      })
      personalSignResult.innerHTML = sign
      personalSignVerify.disabled = false
    } catch (err) {
      console.error(err)
      personalSign.innerHTML = `Error: ${err.message}`
    }
  }

  /**
   * Personal Sign Verify
   */
  personalSignVerify.onclick = async () => {
    const exampleMessage = 'Example `personal_sign` message'
    try {
      const from = accounts[0]
      const msg = `0x${Buffer.from(exampleMessage, 'utf8').toString('hex')}`
      const sign = personalSignResult.innerHTML
      const recoveredAddr = recoverPersonalSignature({
        'data': msg,
        'sig': sign,
      })
      if (recoveredAddr === from) {
        console.log(`SigUtil Successfully verified signer as ${recoveredAddr}`)
        personalSignVerifySigUtilResult.innerHTML = recoveredAddr
      } else {
        console.log(`SigUtil Failed to verify signer when comparing ${recoveredAddr} to ${from}`)
        console.log(`Failed comparing ${recoveredAddr} to ${from}`)
      }
      const ecRecoverAddr = await ethereum.request({
        method: 'personal_ecRecover',
        params: [msg, sign],
      })
      if (ecRecoverAddr === from) {
        console.log(`Successfully ecRecovered signer as ${ecRecoverAddr}`)
        personalSignVerifyECRecoverResult.innerHTML = ecRecoverAddr
      } else {
        console.log(`Failed to verify signer when comparing ${ecRecoverAddr} to ${from}`)
      }
    } catch (err) {
      console.error(err)
      personalSignVerifySigUtilResult.innerHTML = `Error: ${err.message}`
      personalSignVerifyECRecoverResult.innerHTML = `Error: ${err.message}`
    }
  }

  /**
   * Sign Typed Data Test
   */
  signTypedData.onclick = async () => {
    const msgParams = [
      {
        type: 'string',
        name: 'Message',
        value: 'Hi, Alice!',
      },
      {
        type: 'uint32',
        name: 'A number',
        value: '1337',
      },
    ]
    try {
      const from = accounts[0]
      const sign = await ethereum.request({
        method: 'eth_signTypedData',
        params: [msgParams, from],
      })
      signTypedDataResult.innerHTML = sign
      signTypedDataVerify.disabled = false
    } catch (err) {
      console.error(err)
      signTypedDataResult.innerHTML = `Error: ${err.message}`
    }
  }

  /**
   * Sign Typed Data Verification
   */
  signTypedDataVerify.onclick = async () => {
    const msgParams = [
      {
        type: 'string',
        name: 'Message',
        value: 'Hi, Alice!',
      },
      {
        type: 'uint32',
        name: 'A number',
        value: '1337',
      },
    ]
    try {
      const from = accounts[0]
      const sign = signTypedDataResult.innerHTML
      const recoveredAddr = await recoverTypedSignatureLegacy({
        'data': msgParams,
        'sig': sign,
      })
      if (toChecksumAddress(recoveredAddr) === toChecksumAddress(from)) {
        console.log(`Successfully verified signer as ${recoveredAddr}`)
        signTypedDataVerifyResult.innerHTML = recoveredAddr
      } else {
        console.log(`Failed to verify signer when comparing ${recoveredAddr} to ${from}`)
      }
    } catch (err) {
      console.error(err)
      signTypedDataV3VerifyResult.innerHTML = `Error: ${err.message}`
    }
  }

  /**
   * Sign Typed Data Version 3 Test
   */
  signTypedDataV3.onclick = async () => {
    const networkId = parseInt(networkDiv.innerHTML, 10)
    const chainId = parseInt(chainIdDiv.innerHTML, 16) || networkId

    const msgParams = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      message: {
        sender: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        recipient: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    }
    try {
      const from = accounts[0]
      const sign = await ethereum.request({
        method: 'eth_signTypedData_v3',
        params: [from, JSON.stringify(msgParams)],
      })
      signTypedDataV3Result.innerHTML = sign
      signTypedDataV3Verify.disabled = false
    } catch (err) {
      console.error(err)
      signTypedDataV3Result.innerHTML = `Error: ${err.message}`
    }
  }

  /**
   * Sign Typed Data V3 Verification
   */
  signTypedDataV3Verify.onclick = async () => {
    const networkId = parseInt(networkDiv.innerHTML, 10)
    const chainId = parseInt(chainIdDiv.innerHTML, 16) || networkId

    const msgParams = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      message: {
        sender: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        recipient: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    }
    try {
      const from = accounts[0]
      const sign = signTypedDataV3Result.innerHTML
      const recoveredAddr = await recoverTypedSignature({
        'data': msgParams,
        'sig': sign,
      })
      if (toChecksumAddress(recoveredAddr) === toChecksumAddress(from)) {
        console.log(`Successfully verified signer as ${recoveredAddr}`)
        signTypedDataV3VerifyResult.innerHTML = recoveredAddr
      } else {
        console.log(`Failed to verify signer when comparing ${recoveredAddr} to ${from}`)
      }
    } catch (err) {
      console.error(err)
      signTypedDataV3VerifyResult.innerHTML = `Error: ${err.message}`
    }
  }

  /**
   * Sign Typed Data V4
   */
  signTypedDataV4.onclick = async () => {
    const networkId = parseInt(networkDiv.innerHTML, 10)
    const chainId = parseInt(chainIdDiv.innerHTML, 16) || networkId
    const msgParams = {
      domain: {
        chainId,
        name: 'Ether Mail',
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        version: '1',
      },
      message: {
        contents: 'Hello, Bob!',
        from: {
          name: 'Cow',
          wallets: [
            '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
          ],
        },
        to: [
          {
            name: 'Bob',
            wallets: [
              '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
              '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
              '0xB0B0b0b0b0b0B000000000000000000000000000',
            ],
          },
        ],
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Group: [{ name: 'name', type: 'string' }, { name: 'members', type: 'Person[]' }],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person[]' },
          { name: 'contents', type: 'string' },
        ],
        Person: [{ name: 'name', type: 'string' }, { name: 'wallets', type: 'address[]' }],
      },
    }
    try {
      const from = accounts[0]
      const sign = await ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [from, JSON.stringify(msgParams)],
      })
      signTypedDataV4Result.innerHTML = sign
      signTypedDataV4Verify.disabled = false
    } catch (err) {
      console.error(err)
      signTypedDataV4Result.innerHTML = `Error: ${err.message}`
    }
  }

  /**
   *  Sign Typed Data V4 Verification
   */
  signTypedDataV4Verify.onclick = async () => {
    const networkId = parseInt(networkDiv.innerHTML, 10)
    const chainId = parseInt(chainIdDiv.innerHTML, 16) || networkId
    const msgParams = {
      domain: {
        chainId,
        name: 'Ether Mail',
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        version: '1',
      },
      message: {
        contents: 'Hello, Bob!',
        from: {
          name: 'Cow',
          wallets: [
            '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
          ],
        },
        to: [
          {
            name: 'Bob',
            wallets: [
              '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
              '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
              '0xB0B0b0b0b0b0B000000000000000000000000000',
            ],
          },
        ],
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Group: [{ name: 'name', type: 'string' }, { name: 'members', type: 'Person[]' }],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person[]' },
          { name: 'contents', type: 'string' },
        ],
        Person: [{ name: 'name', type: 'string' }, { name: 'wallets', type: 'address[]' }],
      },
    }
    try {
      const from = accounts[0]
      const sign = signTypedDataV4Result.innerHTML
      const recoveredAddr = recoverTypedSignature_v4({
        'data': msgParams,
        'sig': sign,
      })
      if (toChecksumAddress(recoveredAddr) === toChecksumAddress(from)) {
        console.log(`Successfully verified signer as ${recoveredAddr}`)
        signTypedDataV4VerifyResult.innerHTML = recoveredAddr
      } else {
        console.log(`Failed to verify signer when comparing ${recoveredAddr} to ${from}`)
      }
    } catch (err) {
      console.error(err)
      signTypedDataV4VerifyResult.innerHTML = `Error: ${err.message}`
    }
  }

  function handleNodeURL(nodeURL) {
    try {
      initialize(nodeURL)
      starcoinProvider = new providers.JsonrpcProvider(nodeURL);
      getNetworkAndChainId()
      getLatestBlockNumber()
      // getAccountsList()
      connectNodeButton.innerText = 'Node Connected'
      connectNodeButton.disabled = true
      // getAccountsButton.disabled = false
      getBalanceButton.disabled = false
      // alert('Node Connected')
      initializeAccountButtons()
      // updateButtons()
    } catch (err) {
      console.error(err)
    }
  }

  function handleNewAccounts(newAccounts) {
    accounts = newAccounts
    // accountsDiv.innerHTML = accounts
    // if (isMetaMaskConnected()) {
    if (true) {
      // initializeAccountButtons()
    }
    // updateButtons()
  }

  function handleNewChain(chainId) {
    chainIdDiv.innerHTML = chainId
  }

  function handleNewNetwork(networkId) {
    networkDiv.innerHTML = networkId
  }

  function handleLatestBlock(blockNumber) {
    latestBlockDiv.innerHTML = blockNumber
  }

  async function getNetworkAndChainId() {
    try {
      /*
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      })
      */
      const networkInfo = await starcoinProvider.getNetwork()
      const { chainId } = networkInfo
      handleNewChain(chainId)

      /*
      const networkId = await ethereum.request({
        method: 'net_version',
      })
      */
      const { name: networkId } = networkInfo
      handleNewNetwork(networkId)
    } catch (err) {
      console.error(err)
    }
  }

  async function getLatestBlockNumber() {
    try {
      const latestBlock = await starcoinProvider.getBlockNumber() || 123
      handleLatestBlock(latestBlock)
    } catch (err) {
      console.error(err)
    }
  }

  async function getAccountsList() {
    try {
      const accountsList = await starcoinProvider.listAccounts()
      handleNewAccounts(accountsList)
      // console.log({accountsList})
    } catch (err) {
      console.error(err)
    }
  }

  // updateButtons()

  // if (isMetaMaskInstalled()) {
  if (isNodeConnected) {

    ethereum.autoRefreshOnNetworkChange = false
    getNetworkAndChainId()
    getLatestBlockNumber()

    ethereum.on('chainChanged', handleNewChain)
    ethereum.on('networkChanged', handleNewNetwork)
    ethereum.on('accountsChanged', handleNewAccounts)

    try {
      /*
      const newAccounts = await ethereum.request({
        method: 'eth_accounts',
      })
      */
      console.log('new accounts get')
      // const newAccounts = await starcoinProvider.listAccounts()
      // handleNewAccounts(newAccounts)
    } catch (err) {
      console.error('Error on init when getting accounts', err)
    }
  }
}

window.addEventListener('DOMContentLoaded', initialize)

// utils

function getPermissionsDisplayString(permissionsArray) {
  if (permissionsArray.length === 0) {
    return 'No permissions found.'
  }
  const permissionNames = permissionsArray.map((perm) => perm.parentCapability)
  return permissionNames.reduce((acc, name) => `${acc}${name}, `, '').replace(/, $/u, '')
}

function stringifiableToHex(value) {
  return ethers.utils.hexlify(Buffer.from(JSON.stringify(value)))
}
