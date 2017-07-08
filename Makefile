export PATH := $(shell npm bin):$(PATH)

all:
	truffle compile
	truffle migrate
	mkdir -p build/out
	cp frontend/index.html build/out
	cp frontend/flending.css build/out
	browserify frontend/flending.js -o build/out/flending-compiled.js
	swarm --recursive up build/out

reset:
	truffle compile
	truffle migrate --reset
	mkdir -p build/out
	cp frontend/index.html build/out
	cp frontend/flending.css build/out
	browserify frontend/flending.js -o build/out/flending-compiled.js
	swarm --recursive up build/out

testrpc.pid:
	{ testrpc & echo $$! > $@; }


test: testrpc.pid
	truffle test || true
	kill `cat $<` && rm $<
