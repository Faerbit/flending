"use strict";

var db;
var contract;
var account;

function getConversionFactor(option) {
    var c = {
        "Seconds": 1,
        "Minutes": 60,
        "Hours": 60*60,
        "Days": 60*60*24,
        "Weeks": 60*60*24*7,
        "wei": 1,
        "babbage": 1e3,
        "lovelace": 1e6,
        "shannon": 1e9,
        "szabo": 1e12,
        "finney": 1e15,
        "ether": 1e18
    }
    var ret = 0;
    $.each(c, function(key, value) {
        if (option.includes(key)) {
            ret = c[key];
            return;
        }
    });
    return ret;
}

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
    console.log("Pre conversion: ");
    console.log(par);
    $.each(par, function(key, value) {
        if (key.includes("Chooser")){
            par[key.substring(0, key.length-7)] *= getConversionFactor(value);
        }
    });
    console.log("Post conversion: ");
    console.log(par);
    if (valid) {
        return par;
    }
    else {
        return false;
    }
}

function processItem(lendId) {
    contract.lendItems.call(lendId).then(item => {
        var name = db.exec("select name from items where rowid = " + item[0] + ";")
        name = name[0]["values"][0][0];
        console.log("item: ");
        console.log(lendId);
        console.log("name: ");
        console.log(name);
        console.log("lender: ");
        console.log(item[2]);
        console.log("next lender: ");
        console.log(item[6]);
        console.log("lender == next lender: ");
        console.log(item[2] == item[6]);
        console.log("timeFrame: ");
        console.log(item[4]);
        console.log("next lendEnd: ");
        console.log(item[7]);
        console.log("next timeFrame: ");
        console.log(item[8]);
        console.log("status: ");
        console.log(item[5]);
        contract.policies.call(item[1]).then(policy => {
            if (item[2] == account || item[6] == account) {
                    $("#lendTableBorrow").append("<tr>");
                    $("#lendTableBorrow").append("<td>" + name + "</td>");
                    $("#lendTableBorrow").append("<td>" + policy[0] + "</td>");
                    $("#lendTableBorrow").append("<td>" + new Date(item[3]*1000).toLocaleString() + "</td>");
                    if (item[5].toNumber() == 0) {
                        $("#lendTableBorrow").append("<td>Requested</td>");
                    }
                    else if (item[5].toNumber() == 1) {
                        $("#lendTableBorrow").append("<td>Accepted</td>");
                    }
                    else if (item[5].toNumber() == 2) {
                        $("#lendTableBorrow").append("<td>Confirmed</td>");
                    }
                    if(item[2] != item[6] && item[2] == account && item[5].toNumber() == 0) {
                        $("#lendTableBorrow").append("<td>" + item[6] + "</td>");
                        var buttonIdAccept = "acceptBorrow" + lendId;
                        var buttonIdDecline = "declineBorrow" + lendId;
                        $("#lendTableBorrow").append("<td><button class=\"btn btn-success\" id=\"" + buttonIdAccept + "\" >Accept</button></td>");
                        $("#lendTableBorrow").append("<td><button class=\"btn btn-danger\" id=\"" + buttonIdDecline + "\" >Decline</button></td>");
                        var context = { lendId : lendId, buttonId: buttonIdAccept };
                        $("#" + buttonIdAccept).on("click", acceptLend.bind(context));
                        var context = { lendId : lendId, buttonId: buttonIdDecline };
                        $("#" + buttonIdDecline).on("click", declineLend.bind(context));
                    }
                    if(item[5].toNumber() == 1 &&
                        ((item[2] == item[6] && item[2] == account)
                          || (item[2] != item[6] && item[6] == account))) {
                        $("#lendTableBorrow").append("<td></td>");
                        var buttonIdConfirm = "confirmLend" + lendId;
                        $("#lendTableBorrow").append("<td><button class=\"btn btn-primary\" id=\"" + buttonIdConfirm + "\" >Confirm</button></td>");
                        var context = { lendId : lendId, buttonId: buttonIdConfirm };
                        $("#" + buttonIdConfirm).on("click", confirmLend.bind(context));
                    }
                    $("#lendTableBorrow").append("</tr>");
            }
            if (item[2] == item[6] && item[5].toNumber() < 2)  {
                $("#lendTableUnconfirmed").append("<tr>");
                $("#lendTableUnconfirmed").append("<td>" + name + "</td>");
                $("#lendTableUnconfirmed").append("<td>" + policy[0] + "</td>");
                $("#lendTableUnconfirmed").append("<td>" + item[2] + "</td>");
                $("#lendTableUnconfirmed").append("<td>" + new Date(item[3]*1000).toLocaleString() + "</td>");
                if (item[5].toNumber() == 0) {
                    $("#lendTableUnconfirmed").append("<td>Requested</td>");
                }
                else if (item[5].toNumber() == 1) {
                    $("#lendTableUnconfirmed").append("<td>Accepted</td>");
                }
                if (item[5].toNumber() == 0) {
                    var buttonIdAccept = "acceptLend" + lendId;
                    var buttonIdDecline = "declineLend" + lendId;
                    $("#lendTableUnconfirmed").append("<td><button class=\"btn btn-success\" id=\"" + buttonIdAccept + "\" >Accept</button></td>");
                    $("#lendTableUnconfirmed").append("<td><button class=\"btn btn-danger\" id=\"" + buttonIdDecline + "\" >Decline</button></td>");
                    $("#lendTableUnconfirmed").append("</tr>");
                    var context = { lendId : lendId, buttonId: buttonIdAccept };
                    $("#" + buttonIdAccept).on("click", acceptLend.bind(context));
                    var context = { lendId : lendId, buttonId: buttonIdDecline };
                    $("#" + buttonIdDecline).on("click", declineLend.bind(context));
                }
            }
            else {
                $("#lendTableConfirmed").append("<tr>");
                $("#lendTableConfirmed").append("<td>" + name + "</td>");
                $("#lendTableConfirmed").append("<td>" + policy[0] + "</td>");
                $("#lendTableConfirmed").append("<td>" + item[2] + "</td>");
                $("#lendTableConfirmed").append("<td>" + new Date(item[3]*1000).toLocaleString() + "</td>");
                var buttonId = "complete" + lendId;
                $("#lendTableConfirmed").append("<td><button class=\"btn btn-primary\" id=\"" + buttonId + "\" >Received back</button></td>");
                $("#lendTableConfirmed").append("</tr>");
                var context = { lendId : lendId, buttonId: buttonId };
                $("#" + buttonId).on("click", completeLend.bind(context));
            }
        });
    });
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
                if (policy[8]) {
                    $("#policyTableLend").append("<td>Yes</td>");
                }
                else {
                    $("#policyTableLend").append("<td>No</td>");
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
                if (policy[8]) {
                    $("#policyTableBorrow").append("<td>Yes</td>");
                }
                else {
                    $("#policyTableBorrow").append("<td>No</td>");
                }
                $("#policyTableBorrow").append("</tr>");
            });
        }
    });
    contract.lendItemsLength().then(length => {
        if (length.toNumber() > 0) {
            $("#lendTableBorrow").html("");
            $("#lendTableUnconfirmed").html("");
            $("#lendTableConfirmed").html("");
        }
        for(var i = 0; i<length.toNumber(); i++) {
            processItem(i);
        }
    });
}

function createNewDatabase() {
    var sql = require("sql.js");
    db = new sql.Database();

    var stmt = "create table categories(name text unique);"
    stmt += "create table items(category text, name text unique);"
    db.run(stmt);
    console.log(db);
    console.log("Created new database.");
}

function refreshLocal() {
    var res = db.exec("select * from categories");
    if (res.length > 0) {
        $("#categories").html("");
        $("#newItemSelect").html("");
        $("#newPolicySelect").html("");
        $("#newRequestSelect").html("");
        var vals = res[0]["values"];
        $.each(vals, function( key, val) {
            $("#categories").append("<tr><td>" + key + "</td><td>" + val + "</td>/tr>");
            $("#newItemSelect").append("<option>" + val + "</option>");
            $("#newPolicySelect").append("<option>" + val + "</option>");
            $("#newRequestSelect").append("<option>" + val + "</option>");
        });
        updateLendForm($("#newRequestSelect").val());
    }
    res = db.exec("select * from items");
    if (res.length > 0) {
        $("#items").html("");
        var vals = res[0]["values"];
        $.each(vals, function( key, val) {
            $("#items").append("<tr><td>" + key + "</td><td>" + val[0] + "</td><td>" + val[1] + "</td>/tr>");
        });
    }
}

function requestSelect(event) {
    updateLendForm($(this).val());
}

function updateLendForm(category) {
    var res = db.exec("select name from items where category = '" + category + "'");
    if (res.length > 0) {
        $("#itemSelect").html("");
        $.each(res[0]["values"], function( key, val) {
            $("#itemSelect").append("<option>" + val + "</option>");
        });
    }
    contract.policiesLength().then(length => {
        if (length.toNumber() > 0) {
            $("#policySelect").html("");
        }
        for(var i = 0; i<length.toNumber(); i++) {
            var updated = false;
            contract.policies.call(i).then(policy => {
                if (category === policy[1]) {
                    $("#policySelect").append("<option>" + policy[0] + "</option>");
                    if (!updated) {
                        updateMaxTimeFrame($("#policySelect").val());
                        updated = true;
                    }
                }
            });
        }
    });
}

function updateMaxTimeFrame(policyName) {
    contract.getPolicy(policyName).then(policyId => {
        contract.policies.call(policyId.toNumber()).then(policy => {
            var context = { "dur": policy[2].toNumber()};
            $("#lendDuration").attr({"max" : context["dur"]/getConversionFactor($("#lendDurationChooser").val())});
            $("#lendDurationChooser").off("change");
            $("#lendDurationChooser").change(function() {
                $("#lendDuration").attr({"max" : this.dur/getConversionFactor($("#lendDurationChooser").val())});
            }.bind(context));
        });
    });
}

function newCategory(event) {
    event.preventDefault();
    var par;
    if ((par = parseForm(event)) == false) {
        alert("Please fill in the whole form!");
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
        alert("Please fill in the whole form!");
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
        web3.eth.estimateGas(contract.setCurrentDb.call(hash), function(error, estGas) {
            if (error) {
                console.error(error);
                return;
            }
            contract.setCurrentDb(hash, {from: account, gas: estGas }).then(result => {
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
        alert("Please fill in the whole form!");
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
            par["category"], par["maxTimeFrame"], par["lendingFee"],
            par["minLendingFee"], par["depositAmount"], par["overdueFee"],
            par["maxOverdue"], par["relendingAllowed"]), function(error, estGas) {
                if (error) {
                    console.error(error);
                    return;
                }
                contract.newPolicy(par["name"], par["category"],
                    par["maxTimeFrame"], par["lendingFee"],
                    par["minLendingFee"], par["depositAmount"],
                    par["overdueFee"], par["maxOverdue"],
                    par["relendingAllowed"], {from: account, gas: estGas})
                    .then(function(error, result) {
                        console.log(result);
                        refreshContract();
                        $("#newPolicy :submit").prop("disabled", false);
                    });
        });
    }
}
function submitNewLendRequest(event) {
    event.preventDefault();
    var par;
    if ((par = parseForm(event)) == false) {
        alert("Please fill in the whole form!");
        return;
    }
    else {
        $("#newLendRequest :submit").prop("disabled", true);
        console.log(par);
        var res = db.exec("select rowid from items where name = '" + par["item"] + "'");
        var itemId = res[0]["values"][0][0]
        contract.getPolicy(par["policy"]).then(policyId => {
            web3.eth.estimateGas(contract.lendRequest.call(itemId, par["category"], 
                par["lendDuration"], policyId), function(error, estGas) {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    contract.calcPreLendPayment(policyId, par["lendDuration"]).then( amount => {
                        contract.lendRequest(itemId, par["category"],
                            par["lendDuration"], policyId, {from: account, gas: estGas,
                                value: amount.toNumber()}).then(result => {
                                    console.log(result);
                                    refreshContract();
                                    $("#newLendRequest :submit").prop("disabled", false);
                                });
                    });
            });
        });
    }
}

function declineLend() {
    console.log("lendId: " + this.lendId);
    $("#" + this.buttonId).prop("disabled", true);
    web3.eth.estimateGas(contract.lendDecline.call(this.lendId), function(error, estGas) {
        if (error) {
            console.error(error);
            return;
        }
        estGas = parseInt(estGas * 1.25);
        console.log(estGas);
        contract.lendDecline(this.lendId, {from: account, gas: estGas}).then(result =>{
            console.log(result);
            refreshContract();
        });
    }.bind(this));
}

function acceptLend() {
    console.log("lendId: " + this.lendId);
    $("#" + this.buttonId).prop("disabled", true);
    web3.eth.estimateGas(contract.lendAccept.call(this.lendId), function(error, estGas) {
        if (error) {
            console.error(error);
            return;
        }
        estGas = parseInt(estGas * 1.25);
        console.log(estGas);
        contract.lendAccept(this.lendId, {from: account, gas: estGas}).then(result =>{
            console.log(result);
            refreshContract();
        });
    }.bind(this));
}

function confirmLend() {
    console.log("lendId: " + this.lendId);
    $("#" + this.buttonId).prop("disabled", true);
    web3.eth.estimateGas(contract.lendConfirm.call(this.lendId), function(error, estGas) {
        if (error) {
            console.error(error);
            return;
        }
        estGas = parseInt(estGas * 1.25);
        console.log(estGas);
        contract.lendConfirm(this.lendId, {from: account, gas: estGas}).then(result =>{
            console.log(result);
            refreshContract();
        });
    }.bind(this));
}

function completeLend() {
    console.log("lendId: " + this.lendId);
    $("#" + this.buttonId).prop("disabled", true);
    web3.eth.estimateGas(contract.lendComplete.call(this.lendId), function(error, estGas) {
        if (error) {
            console.error(error);
            return;
        }
        estGas = parseInt(estGas * 1.25);
        contract.lendComplete(this.lendId, {from: account, gas: estGas}).then(result =>{
            console.log(result);
            refreshContract();
        });
    }.bind(this));
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
            console.log(db);
            refreshLocal();
            refreshContract();
        },
        error => {
            console.error(error);
        });
    }
    contract.owner().then( owner => {
        if (owner == account) {
            $("li.hidden").each(function(index) {
                $(this).removeClass("hidden");
            });
        }
    });
    $("#newCategory").submit(newCategory);
    $("#newCategory :submit").prop("disabled", false);
    $("#newItem").submit(newItem);
    $("#newItem :submit").prop("disabled", false);
    $("#saveDb").on("click", saveDb);
    $("#newPolicy").submit(submitNewPolicy);
    $("#newPolicy :submit").prop("disabled", false);
    $("#newRequestSelect").change(requestSelect);
    $("#policySelect").change(updateMaxTimeFrame);
    $("#newLendRequest").submit(submitNewLendRequest);
    $("#newLendRequest :submit").prop("disabled", false);
}

$(document).ready(function() {
    var Web3 = require("web3");
    if(typeof window.web3 !== 'undefined') {
        console.log("Using current web3");
        var web3 = new Web3(window.web3.currentProvider);
    }
    else {
        console.log("Using localhost web3");
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8700"));
    }
    console.log(web3);
    var contractJson = require("../build/contracts/Lending.json");
    var Contract = require("truffle-contract");
    var Lending = Contract(contractJson);
    Lending.setProvider(web3.currentProvider);
    Lending.deployed().then(function(deployed) {
        contract = deployed;
        console.log(contract);
        deployed.getCurrentDb().then(function(dbAddress) {
            console.log("DB address: " + dbAddress);
            web3.eth.getAccounts(function(error, accounts){
                if (error) {
                    console.error(error);
                }
                else {
                    console.log(accounts);
                    account = accounts[0];
                    init(dbAddress);
                }
            });
        });
    });
});
