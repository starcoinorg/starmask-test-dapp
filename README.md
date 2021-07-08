# Starmask Test Dapp

This is a simple test dapp for use in Starmask e2e tests and manual QA.

Currently hosted [here](http://starmask-test-dapp.starcoin.org.s3-website-ap-northeast-1.amazonaws.com/).

## HTTPS

Online verison will only work if your Starcoin node URL protocol is HTTPS.

If you run it on your local machine, you could use a node URL with HTTP protocol.

Recommended way to add HTTPS to your Starcoin node is using [Caddy](https://caddyserver.com). Install it on your computer, create a Caddyfile in current directory, and run `caddy start`. Caddy will proxy requests to your node.

Example Caddyfile:

```
starcoin.your-domain.com {
    reverse_proxy 127.0.0.1:9850
}
```

## Development

1. Install dependencies

```
yarn
````

2. Start local server

```
yarn start
```

3. Open browser(Chrome/Safari/Firefox, etc), and go to http://localhost:9022

## Contract deployment and execution

Check the file `MyCounter.move` in this repo, try to deploy and execute it in the Starcoin command line, please refer to [Deploy move contract](https://developer.starcoin.org/en/tutorials/deploy_move_contract/).

After you get the address of the contract, you could execute it in this test-dapp.
