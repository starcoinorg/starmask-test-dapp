import { arrayify, hexlify } from '@ethersproject/bytes'
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util'
import BigNumber from 'bignumber.js'
import StarMaskOnboarding from '@starcoin/starmask-onboarding'
import { providers, utils, bcs, encoding } from '@starcoin/starcoin'

let starcoinProvider

const currentUrl = new URL(window.location.href)
const forwarderOrigin = currentUrl.hostname === 'localhost'
  ? 'http://localhost:9032'
  : undefined

const { isStarMaskInstalled } = StarMaskOnboarding

// Dapp Status Section
const networkDiv = document.getElementById('network')
const chainIdDiv = document.getElementById('chainId')
const accountsDiv = document.getElementById('accounts')

// Basic Actions Section
const onboardButton = document.getElementById('connectButton')
const getAccountsButton = document.getElementById('getAccounts')
const getAccountsResults = document.getElementById('getAccountsResult')

// Permissions Actions Section
const requestPermissionsButton = document.getElementById('requestPermissions')
const getPermissionsButton = document.getElementById('getPermissions')
const permissionsResult = document.getElementById('permissionsResult')

// Send STC Section
const sendButton = document.getElementById('sendButton')
const callContractButton = document.getElementById('callContractButton')
const contractStatus2 = document.getElementById('contractStatus2')

// Contract Section
const contractPayloadhex = document.getElementById('contractPayloadhex')
contractPayloadhex.innerHTML = '7f1ae49d8a574cb95b491d7ab7d5be6d02ab02a11ceb0b0200000009010006020609030f2204310805392807615708b801200ad801050cdd0126000001010102000007000202040100000300010000040201000206040101040107050101040204070801040108090101040203030304030503010c00020c0401080002060c0201060c010b0101080002060c04010b0101090002060c0b0101090003506464074163636f756e7405546f6b656e04696e6974046d696e740b64756d6d795f6669656c640e72656769737465725f746f6b656e0f646f5f6163636570745f746f6b656e0f6465706f7369745f746f5f73656c667f1ae49d8a574cb95b491d7ab7d5be6d0000000000000000000000000000000100020105010002000001060e00310338000e003801020102000006080e000a0138020c020e000b02380302008d03a11ceb0b020000000a010006020609030f3a04490c0555310786017a0880022006a002030aa302050ca80238000001010102000007000202040100000300010000040102010400050301000006010400020806010104010907010104020a010202040402050a0b0104010b0c010104020601040104040505050608070508050905010c000101020c04010501080002060c0201060c0208000900010b0101080002060c04010b0101090002060c0b0101090003414243074163636f756e7405546f6b656e04696e69740669735f616263046d696e740d746f6b656e5f616464726573730b64756d6d795f6669656c640e72656769737465725f746f6b656e0f646f5f6163636570745f746f6b656e0d69735f73616d655f746f6b656e0f6465706f7369745f746f5f73656c667f1ae49d8a574cb95b491d7ab7d5be6d0000000000000000000000000000000102011200020107010002000001060e00070038000e003801020101000001023802020202000009080e000a0138030c020e000b023804020301000001023805020000'
const deployButton = document.getElementById('deployButton')
const tokenAddressButton = document.getElementById('tokenAddressButton')
const contractStatus = document.getElementById('contractStatus')

// Signature Section
const personalSign = document.getElementById('personalSign')
const personalSignResult = document.getElementById('personalSignResult')
const personalSignVerify = document.getElementById('personalSignVerify')
const personalSignRecoverResult = document.getElementById('personalSignRecoverResult')

const initialize = async () => {
  console.log('initialize')
  try {
    // We must specify the network as 'any' for starcoin to allow network changes
    starcoinProvider = new providers.Web3Provider(window.starcoin, 'any')
  } catch (error) {
    console.error(error)
  }

  let onboarding
  try {
    onboarding = new StarMaskOnboarding({ forwarderOrigin })
  } catch (error) {
    console.error(error)
  }

  let accounts
  let accountButtonsInitialized = false

  const accountButtons = [
    getAccountsButton,
    requestPermissionsButton,
    getPermissionsButton,
    sendButton,
    callContractButton,
    deployButton,
    tokenAddressButton,
    personalSign,
    personalSignVerify,
  ]

  const isStarMaskConnected = () => accounts && accounts.length > 0

  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress'
    onboardButton.disabled = true
    onboarding.startOnboarding()
  }

  const onClickConnect = async () => {
    try {
      const newAccounts = await window.starcoin.request({
        method: 'stc_requestAccounts',
      })
      handleNewAccounts(newAccounts)
    } catch (error) {
      console.error(error)
    }
  }

  const clearTextDisplays = () => {
    // encryptionKeyDisplay.innerText = ''
    // encryptMessageInput.value = ''
    // ciphertextDisplay.innerText = ''
    // cleartextDisplay.innerText = ''
  }

  const updateButtons = () => {
    const accountButtonsDisabled = !isStarMaskInstalled() || !isStarMaskConnected()
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
        button.disabled = true
      }
      clearTextDisplays()
    } else {
      getAccountsButton.disabled = false
      requestPermissionsButton.disabled = false
      getPermissionsButton.disabled = false
      sendButton.disabled = false
      callContractButton.disabled = false
      deployButton.disabled = false
      personalSign.disabled = false
    }

    if (!isStarMaskInstalled()) {
      onboardButton.innerText = 'Click here to install StarMask!'
      onboardButton.onclick = onClickInstall
      onboardButton.disabled = false
    } else if (isStarMaskConnected()) {
      onboardButton.innerText = 'Connected'
      onboardButton.disabled = true
      if (onboarding) {
        onboarding.stopOnboarding()
      }
    } else {
      onboardButton.innerText = 'Connect'
      onboardButton.onclick = onClickConnect
      onboardButton.disabled = false
    }
  }

  const initializeAccountButtons = () => {

    if (accountButtonsInitialized) {
      return
    }
    accountButtonsInitialized = true

    getAccountsButton.onclick = async () => {
      try {
        const _accounts = await window.starcoin.request({
          method: 'stc_accounts',
        })
        getAccountsResults.innerHTML = _accounts[0] || 'Not able to get accounts'
      } catch (err) {
        console.error(err)
        getAccountsResults.innerHTML = `Error: ${err.message}`
      }
    }

    /**
     * Permissions
     */

    requestPermissionsButton.onclick = async () => {
      try {
        permissionsResult.innerHTML = ''
        const permissionsArray = await window.starcoin.request({
          method: 'wallet_requestPermissions',
          params: [{ stc_accounts: {} }],
        })
        permissionsResult.innerHTML = getPermissionsDisplayString(permissionsArray)
      } catch (err) {
        console.error(err)
        permissionsResult.innerHTML = `Error: ${err.message}`
      }
    }

    getPermissionsButton.onclick = async () => {
      try {
        permissionsResult.innerHTML = ''
        const permissionsArray = await window.starcoin.request({
          method: 'wallet_getPermissions',
        })
        permissionsResult.innerHTML = getPermissionsDisplayString(permissionsArray)
      } catch (err) {
        console.error(err)
        permissionsResult.innerHTML = `Error: ${err.message}`
      }
    }

    /**
     * Sending STC
     */

    sendButton.onclick = async () => {
      console.log('sendButton.onclick')

      const toAccount = document.getElementById('toAccountInput').value
      if (!toAccount) {
        // eslint-disable-next-line no-alert
        window.alert('Invalid To: can not be empty!')
        return false
      }

      const sendAmount = parseFloat(document.getElementById('amountInput').value, 10)
      if (!(sendAmount > 0)) {
        // eslint-disable-next-line no-alert
        window.alert('Invalid sendAmount: should be a number!')
        return false
      }
      const BIG_NUMBER_NANO_STC_MULTIPLIER = new BigNumber('1000000000')
      const sendAmountSTC = new BigNumber(String(document.getElementById('amountInput').value), 10)
      const sendAmountNanoSTC = sendAmountSTC.times(BIG_NUMBER_NANO_STC_MULTIPLIER)
      const sendAmountHex = `0x${sendAmountNanoSTC.toString(16)}`
      console.log({ sendAmountHex, sendAmountNanoSTC: sendAmountNanoSTC.toString(10) })

      const transactionHash = await starcoinProvider.getSigner().sendUncheckedTransaction({
        to: toAccount,
        value: sendAmountHex,
        gasLimit: 127845,
        gasPrice: 1,
      })
      console.log(transactionHash)
    }

    callContractButton.onclick = async () => {
      contractStatus2.innerHTML = 'Calling'
      callContractButton.disabled = true
      try {
        const functionId = '0x1::TransferScripts::peer_to_peer'
        const strTypeArgs = ['0x1::STC::STC']
        const tyArgs = utils.tx.encodeStructTypeTags(strTypeArgs)
        const toAccount = document.getElementById('toAccountInput').value
        if (!toAccount) {
          // eslint-disable-next-line no-alert
          window.alert('Invalid To: can not be empty!')
          return false
        }
        console.log({ toAccount })

        const sendAmount = parseFloat(document.getElementById('amountInput').value, 10)
        if (!(sendAmount > 0)) {
          // eslint-disable-next-line no-alert
          window.alert('Invalid sendAmount: should be a number!')
          return false
        }
        const BIG_NUMBER_NANO_STC_MULTIPLIER = new BigNumber('1000000000')
        const sendAmountSTC = new BigNumber(String(document.getElementById('amountInput').value), 10)
        const sendAmountNanoSTC = sendAmountSTC.times(BIG_NUMBER_NANO_STC_MULTIPLIER)
        const sendAmountHex = `0x${sendAmountNanoSTC.toString(16)}`

        // Multiple BcsSerializers should be used in different closures, otherwise, the latter will be contaminated by the former.
        const amountSCSHex = (function () {
          const se = new bcs.BcsSerializer()
          // eslint-disable-next-line no-undef
          se.serializeU128(BigInt(sendAmountNanoSTC.toString(10)))
          return hexlify(se.getBytes())
        })()
        console.log({ sendAmountHex, sendAmountNanoSTC: sendAmountNanoSTC.toString(10), amountSCSHex })

        const args = [
          arrayify(toAccount),
          Buffer.from('00', 'hex'),
          arrayify(amountSCSHex),
        ]

        const scriptFunction = utils.tx.encodeScriptFunction(functionId, tyArgs, args)
        console.log(scriptFunction)

        // Multiple BcsSerializers should be used in different closures, otherwise, the latter will be contaminated by the former.
        const payloadInHex = (function () {
          const se = new bcs.BcsSerializer()
          scriptFunction.serialize(se)
          return hexlify(se.getBytes())
        })()
        console.log({ payloadInHex })

        const transactionHash = await starcoinProvider.getSigner().sendUncheckedTransaction({
          data: payloadInHex,
        })
        console.log({ transactionHash })

      } catch (error) {
        contractStatus2.innerHTML = 'Call Failed'
        callContractButton.disabled = false
        throw error
      }
      contractStatus2.innerHTML = 'Call Completed'
      callContractButton.disabled = false
    }

    /**
     * Contract Interactions
     */

    deployButton.onclick = async () => {
      let transactionHash
      contractStatus.innerHTML = 'Deploying'

      try {
        const packageHex = contractPayloadhex.innerHTML
        const transactionPayloadHex = encoding.packageHexToTransactionPayloadHex(packageHex)
        transactionHash = await starcoinProvider.getSigner().sendUncheckedTransaction({
          data: transactionPayloadHex,
        })
        console.log({ transactionHash })
      } catch (error) {
        contractStatus.innerHTML = 'Deployment Failed'
        throw error
      }

      console.log(`Contract deployed! address: ${accounts[0]} transactionHash: ${transactionHash}`)
      contractStatus.innerHTML = 'Deployed'
      tokenAddressButton.disabled = false
      // console.log(contract)
    }

    tokenAddressButton.onclick = async () => {
      contractStatus.innerHTML = 'contract method request started'
      try {
        const result = await starcoinProvider.call({
          function_id: `${accounts[0]}::ABC::token_address`,
          type_args: [],
          args: [],
        })
        contractStatus.innerHTML = result[0]
      } catch (error) {
        console.log(error)
        throw error
      }
    }

    /**
     * Personal Sign
     */
    personalSign.onclick = async () => {
      const exampleMessage = 'Example `personal_sign` message 中文'
      try {
        personalSignResult.innerHTML = ''
        personalSignVerify.disabled = false
        personalSignRecoverResult.innerHTML = ''
        const from = accounts[0]
        const msg = `0x${Buffer.from(exampleMessage, 'utf8').toString('hex')}`
        console.log({ msg })
        const networkId = networkDiv.innerHTML
        const extraParams = { networkId }
        const sign = await window.starcoin.request({
          method: 'personal_sign',
          // params: [msg, from, 'Example password'],
          // extraParams = params[2] || {}; means it should be an object:
          // params: [msg, from, { pwd: 'Example password' }],
          params: [msg, from, extraParams],
        })
        personalSignResult.innerHTML = sign
      } catch (err) {
        console.error(err)
        personalSign.innerHTML = `Error: ${err.message}`
      }
    }

    /**
     * Personal Sign Verify
     */
    personalSignVerify.onclick = async () => {
      try {
        const from = accounts[0]
        const sign = personalSignResult.innerHTML
        const recoveredAddr = await utils.signedMessage.recoverSignedMessageAddress(sign)
        console.log({ recoveredAddr })

        if (recoveredAddr === from) {
          console.log(`@starcoin/starcoin Successfully verified signer as ${recoveredAddr}`)
          personalSignRecoverResult.innerHTML = recoveredAddr
        } else {
          console.log('@starcoin/starcoin Failed to verify signer')
        }
      } catch (err) {
        console.error(err)
        personalSignRecoverResult.innerHTML = `Error: ${err.message}`
      }
    }
  }

  function handleNewAccounts(newAccounts) {
    accounts = newAccounts
    accountsDiv.innerHTML = accounts
    if (getAccountsResults.innerHTML) {
      getAccountsResults.innerHTML = accounts
    }
    if (isStarMaskConnected()) {
      initializeAccountButtons()
    }
    updateButtons()
  }

  function handleNewChain(chainId) {
    chainIdDiv.innerHTML = chainId
  }

  function handleNewNetwork(networkId) {
    networkDiv.innerHTML = networkId
  }

  async function getNetworkAndChainId() {
    try {
      const chainInfo = await window.starcoin.request({
        method: 'chain.id',
      })
      handleNewChain(`0x${chainInfo.id.toString(16)}`)
      handleNewNetwork(chainInfo.id)
    } catch (err) {
      console.error(err)
    }
  }

  updateButtons()

  if (isStarMaskInstalled()) {

    window.starcoin.autoRefreshOnNetworkChange = false
    getNetworkAndChainId()

    try {
      const newAccounts = await window.starcoin.request({
        method: 'stc_accounts',
      })
      handleNewAccounts(newAccounts)
    } catch (err) {
      console.error('Error on init when getting accounts', err)
    }

    window.starcoin.on('chainChanged', handleNewChain)
    window.starcoin.on('networkChanged', handleNewNetwork)
    window.starcoin.on('accountsChanged', handleNewAccounts)
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
