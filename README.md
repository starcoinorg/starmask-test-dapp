# Starcoin Test Dapp

This is a simple test dapp for use in Starcoin e2e tests and manual QA.

Currently hosted [here](https://starcoin-test-dapp.vercel.app).

## HTTPS

Online verison will only work if your Starcoin node URL protocol is HTTPS.

If you run it on your local machine, you could use a node URL with HTTP protocol.

Recommended way to add HTTPS to your Starcoin node is using [Caddy](https://caddyserver.com). Install it on you computer, create a Caddyfile in current directory, and run `caddy start`. Caddy will proxy requests to your node.

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
