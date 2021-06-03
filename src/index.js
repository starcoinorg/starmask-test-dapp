import StarMaskOnboarding from '@starcoin/starmask-onboarding'
import { ethers } from 'ethers'

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


const initialize = async () => {
  console.log('initialize')
  try {
    // We must specify the network as 'any' for starcoin to allow network changes
    starcoinProvider = new ethers.providers.Web3Provider(window.starcoin, 'any')
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
  ]

  const isMetaMaskConnected = () => accounts && accounts.length > 0

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

  const updateButtons = () => {
    if (!isStarMaskInstalled()) {
      onboardButton.innerText = 'Click here to install StarMask!'
      onboardButton.onclick = onClickInstall
      onboardButton.disabled = false
    } else if (isMetaMaskConnected()) {
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
        const permissionsArray = await window.starcoin.request({
          method: 'wallet_getPermissions',
        })
        permissionsResult.innerHTML = getPermissionsDisplayString(permissionsArray)
      } catch (err) {
        console.error(err)
        permissionsResult.innerHTML = `Error: ${err.message}`
      }
    }
  }

  function handleNewAccounts(newAccounts) {
    accounts = newAccounts
    accountsDiv.innerHTML = accounts
    if (isMetaMaskConnected()) {
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
