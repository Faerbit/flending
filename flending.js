
function submitNewPolicy(event) {
    event.preventDefault();
    var par = {};
    $.each($(event.target).serializeArray(), function(_, kv) {
        par[kv.name] = kv.value;
    });
    var valid = true;
    $.each(par, function(key, value) {
        if (value == "")  {
            return (valid = false);
        }
    });
    if (valid == false) {
        alert("Alle Felder müssen ausgefüllt werden!");
        return;
    }
    else {
        if ("relendingAllowed" in par){
            par["relendingAllowed"] = true;
        }
        else {
            par["relendingAllowed"] = false;
        }
            console.log(par);
            this.contract.newPolicy(par["name"], par["idStart"], par["idEnd"],
                par["maxTimeFrame"], par["lendingFee"], par["depositAmount"],
                par["overdueTickMoneyRate"], par["overdueTickTimeRate"],
                par["maxOverdue"],
                par["relendingAllowed"], 
                {from: this.web3.eth.accounts[0], gas: 4700000},
            function(error, result) {
                if(error) {
                    console.error(error);
                }
                else {
                    console.log(result);
                    $("#status").html(this.contract.getPolicy.call(par["name"]).toLocaleString());
                    console.log(this.contract.getPolicy.call(par["name"]).toLocaleString());
                }
            }.bind(this));
            $("#status").html("Querying");
    }
}
function init(web3Instance, contractInstance) {
    $("#newPolicy :submit").prop("disabled", false);
    var context = { web3: web3Instance, contract: contractInstance};
    $("#newPolicy").submit(submitNewPolicy.bind(context));
}

function compile() {
    var Web3 = require("web3");

    var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

    var fs = require("fs");
    var code = fs.readFileSync("build/compiled.sol").toString();
    var contract = web3.eth.compile.solidity(code);
    var LendingContract = web3.eth.contract(contract.info.abiDefinition);
    var contractInstance;
    var deployedContract = LendingContract.new(
        {data: contract.code, from: web3.eth.accounts[0], gas: 4700000},
        function(e, contract) {
            //console.log(e, contract);
            if (typeof contract.address != 'undefined') {
                console.log('Contract mined! address: ' 
                    + contract.address + ' transactionHash: ' + contract.transactionHash);
                contractInstance = LendingContract.at(contract.address);
                init(web3, contractInstance);
            }
        });
    /*var contractInstance = LendingContract.at(deployedContract.address);
    console.log(deployedContract);
    console.log(deployedContract.address);
    console.log(contractInstance.address);*/
}

$(document).ready(function() {
    $("#newPolicy :submit").prop("disabled", true);
    
    setTimeout(compile, 0);
});
