
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
                    $("#status-lend").html(this.contract.getPolicy.call(par["name"]).toLocaleString());
                    console.log(this.contract.getPolicy.call(par["name"]).toLocaleString());
                }
        }.bind(this));
        $("#status-lend").html("Querying");
    }
}

function submitNewLendRequest(event) {
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
        console.log(par);
        var policyId = this.contract.getPolicy.call(par["name"]).toLocaleString();
        this.contract.lendRequest(par["itemId"], par["lendDuration"], policyId,
            {from: this.web3.eth.accounts[1], gas: 4700000},
            function(error, result) {
                if(error) {
                    console.error(error);
                }
                else {
                    console.log(result);
                }
        }.bind(this));
        $("#status-borrow").html("Querying");
    }
}

function refreshUnconfirmed(event) {
    this.contract.lendItems.call(0, function(error, item) {
        if (error) {
            console.error(error);
            $("#un0").html("-");
            $("#un1").html("-");
            $("#un2").html("-");
            return;
        }
        if (item[3] == false) {
            $("#un0").html(item[0]);
            $("#un1").html(item[1].toLocaleString());
            $("#un2").html(item[2].toLocaleString());
            $("#confirm").prop("disabled", false);
            $("#confirm").on("click", function(event) {
                this.contract.lendConfirm(0,
                    {from: this.web3.eth.accounts[0], gas:4700000},
                    function(error, result) {
                        if(error) {
                            console.error(error);
                        }
                        else {
                            console.log(result);
                        }
                    });
            }.bind(this));
        }
        else {
            $("#un0").html("-");
            $("#un1").html("-");
            $("#un2").html("-");
            $("#confirm").prop("disabled", true);
            $("#confirm").off("click");
        }
    }.bind(this));
}
function refreshConfirmed(event) {
    this.contract.lendItems.call(0, function(error, item) {
        if (error) {
            console.error(error);
            $("#co0").html("-");
            $("#co1").html("-");
            $("#co2").html("-");
            return;
        }
        if (item[3] == true) {
            $("#co0").html(item[0]);
            $("#co1").html(item[1].toLocaleString());
            $("#co2").html(item[2].toLocaleString());
            $("#complete").prop("disabled", false);
            $("#complete").on("click", function(event) {
                this.contract.lendComplete(0,
                    {from: this.web3.eth.accounts[0], gas:4700000},
                    function(error, result) {
                        if(error) {
                            console.error(error);
                        }
                        else {
                            console.log(result);
                        }
                    });
            }.bind(this));
        }
        else {
            $("#co0").html("-");
            $("#co1").html("-");
            $("#co2").html("-");
            $("#complete").prop("disabled", true);
            $("#complete").off("click");
        }
    }.bind(this));
}

function refreshConfirmedBorrow(event) {
    this.contract.lendItems.call(0, function(error, item) {
        if (error) {
            console.error(error);
            $("#cob0").html("-");
            $("#cob1").html("-");
            $("#cob2").html("-");
            return;
        }
        if (item[3] == true) {
            $("#cob0").html(item[0]);
            $("#cob1").html(item[1].toLocaleString());
            $("#cob2").html(item[2].toLocaleString());
        }
        else {
            $("#cob0").html("-");
            $("#cob1").html("-");
            $("#cob2").html("-");
        }
    });
}

function init(web3Instance, contractInstance) {
    $("#newPolicy :submit").prop("disabled", false);
    var context = { web3: web3Instance, contract: contractInstance};
    $("#newPolicy").submit(submitNewPolicy.bind(context));
    $("#newLendRequest :submit").prop("disabled", false);
    $("#newLendRequest").submit(submitNewLendRequest.bind(context));
    $("#refreshUnconfirmed").prop("disabled", false);
    $("#refreshUnconfirmed").on("click", refreshUnconfirmed.bind(context));
    $("#refreshComplete").prop("disabled", false);
    $("#refreshComplete").on("click", refreshConfirmed.bind(context));
    $("#refreshCompleteBorrow").prop("disabled", false);
    $("#refreshCompleteBorrow").on("click", refreshConfirmedBorrow.bind(context));
}

function compile() {
    var Web3 = require("web3");

    var web3 = new Web3(new Web3.providers.HttpProvider(
        "http://localhost:8545"));

    var fs = require("fs");
    var code = fs.readFileSync("build/compiled.sol").toString();
    web3.eth.compile.solidity(code, function(error, contract) {
        if(error) {
            console.error(error);
        }
        else {
            var LendingContract = web3.eth.contract(
                contract.info.abiDefinition);
            var deployedContract = LendingContract.new(
                {data: contract.code, from: web3.eth.accounts[0], gas: 4700000},
                function(error, contract) {
                    if(error) {
                        console.error(error);
                    }
                    else {
                        if (typeof contract.address != 'undefined') {
                                console.log('Contract mined! address: ' 
                                    + contract.address + ' transactionHash: '
                                    + contract.transactionHash);
                                var contractInstance = LendingContract.at(
                                    contract.address);
                                init(web3, contractInstance);
                            }
                        }
                });
        }
    });
}

$(document).ready(function() {
    $("#newPolicy :submit").prop("disabled", true);
    $("#newLendRequest :submit").prop("disabled", true);
    $("#refreshUnconfirmed").prop("disabled", true);
    $("#refreshComplete").prop("disabled", true);
    $("#refreshCompleteBorrow").prop("disabled", true);
    $("#confirm").prop("disabled", true);
    $("#complete").prop("disabled", true);
    compile(); 
});
