module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8700,
      network_id: "*" // Match any network id
    },
    rinkeby: {
        host: "localhost",
        port: 8546,
        network_id: "4" // match rinkeby
    }
  }
};
