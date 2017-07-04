"use strict";
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

var db;
var contract;

function parseForm(event) {
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
    if (valid) {
        return par;
    }
    else {
        return false;
    }
}

function refreshContract() {
    contract.policiesLength().then(length => {
        if (length.toNumber() > 0) {
            $("#policyTableLend").html("");
            $("#policyTableBorrow").html("");
        }
        for(var i = 0; i<length.toNumber(); i++) {
            contract.policies.call(i).then(policy => {
                $("#policyTableLend").append("<tr>");
                $("#policyTableLend").append("<td>" + policy[0] + "</td>");
                $("#policyTableLend").append("<td>" + policy[1] + "</td>");
                $("#policyTableLend").append("<td>" + policy[2].toNumber() + "</td>");
                $("#policyTableLend").append("<td>" + policy[3].toNumber() + "</td>");
                $("#policyTableLend").append("<td>" + policy[4].toNumber() + "</td>");
                $("#policyTableLend").append("<td>" + policy[5].toNumber() + "</td>");
                $("#policyTableLend").append("<td>" + policy[6].toNumber() + "</td>");
                $("#policyTableLend").append("<td>" + policy[7].toNumber() + "</td>");
                $("#policyTableLend").append("<td>" + policy[8].toNumber() + "</td>");
                if (policy[9]) {
                    $("#policyTableLend").append("<td>Ja</td>");
                }
                else {
                    $("#policyTableLend").append("<td>Nein</td>");
                }
                $("#policyTableLend").append("</tr>");
                $("#policyTableBorrow").append("<tr>");
                $("#policyTableBorrow").append("<td>" + policy[0] + "</td>");
                $("#policyTableBorrow").append("<td>" + policy[1] + "</td>");
                $("#policyTableBorrow").append("<td>" + policy[2].toNumber() + "</td>");
                $("#policyTableBorrow").append("<td>" + policy[3].toNumber() + "</td>");
                $("#policyTableBorrow").append("<td>" + policy[4].toNumber() + "</td>");
                $("#policyTableBorrow").append("<td>" + policy[5].toNumber() + "</td>");
                $("#policyTableBorrow").append("<td>" + policy[6].toNumber() + "</td>");
                $("#policyTableBorrow").append("<td>" + policy[7].toNumber() + "</td>");
                $("#policyTableBorrow").append("<td>" + policy[8].toNumber() + "</td>");
                if (policy[9]) {
                    $("#policyTableBorrow").append("<td>Ja</td>");
                }
                else {
                    $("#policyTableBorrow").append("<td>Nein</td>");
                }
                $("#policyTableBorrow").append("</tr>");
            });
        }
    });
}

function createNewDatabase() {
    var sql = require("sql.js");
    db = new sql.Database();

    var stmt = "create table categories(name text unique);"
    stmt += "create table items(category text, name text);"
    db.run(stmt);
    console.log("Created new database.");
}

function refreshLocal() {
    $("#categories").html("");
    $("#items").html("");
    $("#newItemSelect").html("");
    $("#newPolicySelect").html("");
    var res = db.exec("select * from categories");
    if (res.length > 0) {
        var vals = res[0]["values"];
        $.each(vals, function( key, val) {
            $("#categories").append("<tr><td>" + key + "</td><td>" + val + "</td>/tr>");
            $("#newItemSelect").append("<option>" + val + "</option>");
            $("#newPolicySelect").append("<option>" + val + "</option>");
        });
    }
    res = db.exec("select * from items");
    if (res.length > 0) {
        var vals = res[0]["values"];
        $.each(vals, function( key, val) {
            $("#items").append("<tr><td>" + key + "</td><td>" + val[0] + "</td><td>" + val[1] + "</td>/tr>");
        });
    }
}

function newCategory(event) {
    event.preventDefault();
    var par;
    if ((par = parseForm(event)) == false) {
        alert("Alle Felder müssen ausgefüllt werden!");
        return;
    }
    else {
        db.run("insert into categories values(:name)", {":name": par["name"]});
        refreshLocal();
        $("#saveDb").prop("disabled", false);
    }
}

function newItem(event) {
    event.preventDefault();
    var par;
    if ((par = parseForm(event)) == false) {
        alert("Alle Felder müssen ausgefüllt werden!");
        return;
    }
    else {
        db.run("insert into items values(:category, :name)", {":category": par["category"], ":name": par["name"]});
        refreshLocal();
        $("#saveDb").prop("disabled", false);
    }
}

function saveDb(event) {
    $("saveDb").prop("disabled", true);
    const swarm = require("swarm-js").at("http://localhost:8500");
    swarm.upload(new Buffer(db.export())).then(hash => {
        console.log(hash);
        web3.eth.estimateGas(contract.setCurrentDb.call(hash), estGas => {
            contract.setCurrentDb(hash, {from: web3.eth.accounts[0], gas: estGas }).then(result => {
                console.log(result);
                refreshLocal();
            });
        });
    });
}

function submitNewPolicy(event) {
    event.preventDefault();
    var par;
    if ((par = parseForm(event)) == false) {
        alert("Alle Felder müssen ausgefüllt werden!");
        return;
    }
    else {
        $("#newPolicy :submit").prop("disabled", true);
        if ("relendingAllowed" in par){
            par["relendingAllowed"] = true;
        }
        else {
            par["relendingAllowed"] = false;
        }
        console.log(par);
        web3.eth.estimateGas(contract.newPolicy.call(par["name"],
            par["category"], par["maxTimeFrame"],
            par["lendingFee"], par["minLendingFee"], par["depositAmount"],
            par["overdueTickMoneyRate"], par["overdueTickTimeRate"],
            par["maxOverdue"], par["relendingAllowed"]), estGas => {
                contract.newPolicy(par["name"],
                    par["category"], par["maxTimeFrame"],
                    par["lendingFee"], par["minLendingFee"], par["depositAmount"],
                    par["overdueTickMoneyRate"], par["overdueTickTimeRate"],
                    par["maxOverdue"], par["relendingAllowed"],
                    {from: web3.eth.accounts[0], gas: estGas}).then(result => {
                        console.log(result);
                        refreshContract();
                        $("#newPolicy :submit").prop("disabled", false);
                    });
        });
    }
}


function init(dbAddress) {
    if (dbAddress === "") {
        createNewDatabase();
    }
    else {
        const swarm = require("swarm-js").at("http://localhost:8500");
        var sql = require("sql.js");
        swarm.download(dbAddress).then(buffer => {
            db = new sql.Database(buffer);
            refreshLocal();
        },
        error => {
            console.error(error);
        });
    }
    contract.owner().then( owner => {
        if (owner == web3.eth.accounts[0]) {
            $("li.hidden").each(function(index) {
                $(this).removeClass("hidden");
            });
        }
    });
    $("#newCategory :submit").prop("disabled", false);
    $("#newCategory").submit(newCategory);
    $("#newItem :submit").prop("disabled", false);
    $("#newItem").submit(newItem);
    $("#saveDb").on("click", saveDb);
    $("#newPolicy :submit").prop("disabled", false);
    $("#newPolicy").submit(submitNewPolicy);
    refreshContract();
}

$(document).ready(function() {
    var Web3 = require("web3");
    if (typeof web3 !== "undefined") {
        window.web3 = new Web3(web3.currentProvider);
    }
    else {
        alert("No web3 provider found. App unable to function!");
        return;
    }
    var contractJson = require("../build/contracts/Lending.json");
    var Contract = require("truffle-contract");
    var Lending = Contract(contractJson);
    Lending.setProvider(web3.currentProvider);
    Lending.deployed().then(function(deployed) {
        contract = deployed;
        console.log(contract);
        deployed.getCurrentDb().then(function(dbAddress) {
            console.log("DB address: " + dbAddress);
            init(dbAddress);
        });
    });
});
