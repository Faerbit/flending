all:
	cat strings.sol lending.sol > build/compiled.sol
	browserify -t brfs flending.js -o build/flending-compiled.js
