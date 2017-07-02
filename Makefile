export PATH := $(shell npm bin):$(PATH)

all:
	truffle compile
	truffle migrate
	mkdir -p build/out
	cp frontend/index.html build/out
	cp frontend/flending.css build/out
	browserify frontend/flending.js -o build/out/flending-compiled.js
	swarm --recursive up build/out
