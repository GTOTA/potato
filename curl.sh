curl -X POST  -H "Content-Type: application/json"  \
--data '{"jsonrpc":"2.0", "id":2, "method": "debug_traceBlockByHash", "params": ["0x4bd0bd4547d8f8a4fc86a024e54558e156c1acf43d82e24733c6dac2fe5c5fc7"] }' \
"https://mainnet.era.zksync.io"

