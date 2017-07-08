#!/bin/bash

if [[ $1 == "clean" ]]
then
    echo "Cleaning..."
    kill -9 $(ps aux | grep swarm | grep bzzaccount | awk '{print $2}')
    kill -9 $(ps aux | grep geth | grep datadir | awk '{print $2}')
    rm -rf /tmp/BZZ
    exit
fi
# Working directory
cd /tmp

# Preparation
DATADIR=/tmp/BZZ/`date +%s`
mkdir -p $DATADIR
read -s -p "Enter Password. It will be stored in $DATADIR/my-password: " MYPASSWORD && echo $MYPASSWORD > $DATADIR/my-password
echo
BZZKEY=$(geth --datadir $DATADIR --password $DATADIR/my-password account new | awk -F"{|}" '{print $2}')
SEC=$(geth --datadir $DATADIR --password $DATADIR/my-password account new | awk -F"{|}" '{print $2}')
THRD=$(geth --datadir $DATADIR --password $DATADIR/my-password account new | awk -F"{|}" '{print $2}')
cat <<EOF > $DATADIR/genesis.json
{
    "config": {
        "chainId": 322,
        "homesteadBlock": 0
    },
    "nonce": "0",
    "difficulty": "0x20000",
    "mixhash": "0x00000000000000000000000000000000000000647572616c65787365646c6578",
    "coinbase": "0x0000000000000000000000000000000000000000",
    "timestamp": "0x00",
    "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "extraData": "0x",
    "gasLimit": "0x8000000",
    "alloc": {
        "$BZZKEY": {"balance": "10000000000000000000" }, 
        "$SEC": {"balance": "10000000000000000000" },
        "$THRD": {"balance": "10000000000000000000" }
    }
}
EOF
geth init --datadir $DATADIR $DATADIR/genesis.json

echo "Your account is ready: "$BZZKEY
echo "Your second account is ready: "$SEC
echo "Your third account is ready: "$THRD
# Run geth in the background
nohup geth --datadir $DATADIR \
    --password <(cat $DATADIR/my-password) \
    --unlock 0 \
    --verbosity 6 \
    --networkid 322 \
    --nodiscover \
    --maxpeers 0 \
    --mine \
    --minerthreads 1 \
    --rpc \
    --rpccorsdomain "*" \
    2>> $DATADIR/geth.log &

echo "geth is running in the background, you can check its logs at "$DATADIR"/geth.log"

# Now run swarm in the background
swarm \
    --bzzaccount $BZZKEY \
    --datadir $DATADIR \
    --ethapi $DATADIR/geth.ipc \
    --verbosity 6 \
    --maxpeers 0 \
    --bzznetworkid 322 \
    &> $DATADIR/swarm.log < <(cat $DATADIR/my-password) &


echo "swarm is running in the background, you can check its logs at "$DATADIR"/swarm.log"

mist \
    --rpc $DATADIR/geth.ipc \
    --node-datadir $DATADIR \
    --node-networkid 322 \
    --node-rpccorsdomain "*" \
    --node-nodiscover \
    --node-maxpeers 0

echo "Cleaning..."
kill  $(ps aux | grep swarm | grep bzzaccount | awk '{print $2}')
kill  $(ps aux | grep geth | grep datadir | awk '{print $2}')
rm -rf /tmp/BZZ

# Cleaning up
# You need to perform this feature manually
# USE THESE COMMANDS AT YOUR OWN RISK!
##

