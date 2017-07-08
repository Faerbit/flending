"use strict";

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
        console.log("next timeFrame: ");
        console.log(item[7]);
        contract.policies.call(item[1]).then(policy => {
            if (item[2] == web3.eth.accounts[0] || item[6] == web3.eth.accounts[0]) {
                    $("#lendTableBorrow").append("<tr>");
                    $("#lendTableBorrow").append("<td>" + name + "</td>");
                    $("#lendTableBorrow").append("<td>" + policy[0] + "</td>");
                    $("#lendTableBorrow").append("<td>" + item[3] + "</td>");
                    if (item[5]) {
                        if(item[2] == web3.eth.accounts[0]) {
                            $("#lendTableBorrow").append("<td>Yes</td>");
                        }
                        else {
                            $("#lendTableBorrow").append("<td>No</td>");
                        }
                    }
                    else {
                        $("#lendTableBorrow").append("<td>No</td>");
                    }
                    if(item[2] != item[6] && item[2] == web3.eth.accounts[0]) {
                        $("#lendTableBorrow").append("<td>" + item[6] + "</td>");
                        var buttonIdConfirm = "confirmBorrow" + lendId;
                        var buttonIdDecline = "declineBorrow" + lendId;
                        $("#lendTableBorrow").append("<td><button class=\"btn btn-success\" id=\"" + buttonIdConfirm + "\" >Confirm</button></td>");
                        $("#lendTableBorrow").append("<td><button class=\"btn btn-danger\" id=\"" + buttonIdDecline + "\" >Decline</button></td>");
                        var context = { lendId : lendId, buttonId: buttonIdConfirm };
                        $("#" + buttonIdConfirm).on("click", confirmLend.bind(context));
                        var context = { lendId : lendId, buttonId: buttonIdDecline };
                        $("#" + buttonIdDecline).on("click", declineLend.bind(context));
                    }
                    $("#lendTableBorrow").append("</tr>");
            }
            if (!item[5])  {
                $("#lendTableUnconfirmed").append("<tr>");
                $("#lendTableUnconfirmed").append("<td>" + name + "</td>");
                $("#lendTableUnconfirmed").append("<td>" + policy[0] + "</td>");
                $("#lendTableUnconfirmed").append("<td>" + item[2] + "</td>");
                $("#lendTableUnconfirmed").append("<td>" + item[3] + "</td>");
                var buttonIdConfirm = "confirmLend" + lendId;
                var buttonIdDecline = "declineLend" + lendId;
                $("#lendTableUnconfirmed").append("<td><button class=\"btn btn-success\" id=\"" + buttonIdConfirm + "\" >Confirm</button></td>");
                $("#lendTableUnconfirmed").append("<td><button class=\"btn btn-danger\" id=\"" + buttonIdDecline + "\" >Decline</button></td>");
                $("#lendTableUnconfirmed").append("</tr>");
                var context = { lendId : lendId, buttonId: buttonIdConfirm };
                $("#" + buttonIdConfirm).on("click", confirmLend.bind(context));
                var context = { lendId : lendId, buttonId: buttonIdDecline };
                $("#" + buttonIdDecline).on("click", declineLend.bind(context));
            }
            else {
                $("#lendTableConfirmed").append("<tr>");
                $("#lendTableConfirmed").append("<td>" + name + "</td>");
                $("#lendTableConfirmed").append("<td>" + policy[0] + "</td>");
                $("#lendTableConfirmed").append("<td>" + item[2] + "</td>");
                $("#lendTableConfirmed").append("<td>" + item[3] + "</td>");
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
            $("#lendDuration").attr({"max" : policy[2].toNumber()});
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
            par["maxOverdue"], par["relendingAllowed"]), estGas => {
                contract.newPolicy(par["name"], par["category"],
                    par["maxTimeFrame"], par["lendingFee"],
                    par["minLendingFee"], par["depositAmount"],
                    par["overdueFee"], par["maxOverdue"],
                    par["relendingAllowed"], {from: web3.eth.accounts[0], gas: estGas})
                    .then(result => {
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
                par["lendDuration"], policyId), estGas => {
                    contract.calcPreLendPayment(policyId, par["lendDuration"]).then( amount => {
                        contract.lendRequest(itemId, par["category"],
                            par["lendDuration"], policyId, {from: web3.eth.accounts[0], gas: estGas,
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
    web3.eth.estimateGas(contract.lendDecline.call(this.lendId), estGas => {
        estGas = parseInt(estGas * 1.25);
        console.log(estGas);
        contract.lendDecline(this.lendId, {from: web3.eth.accounts[0], gas: estGas}).then(result =>{
            console.log(result);
            refreshContract();
        });
    });
}

function confirmLend() {
    console.log("lendId: " + this.lendId);
    $("#" + this.buttonId).prop("disabled", true);
    web3.eth.estimateGas(contract.lendConfirm.call(this.lendId), estGas => {
        estGas = parseInt(estGas * 1.25);
        console.log(estGas);
        contract.lendConfirm(this.lendId, {from: web3.eth.accounts[0], gas: estGas}).then(result =>{
            console.log(result);
            refreshContract();
        });
    });
}

function completeLend() {
    console.log("lendId: " + this.lendId);
    $("#" + this.buttonId).prop("disabled", true);
    web3.eth.estimateGas(contract.lendComplete.call(this.lendId), estGas => {
        estGas = parseInt(estGas * 1.25);
        contract.lendComplete(this.lendId, {from: web3.eth.accounts[0], gas: estGas}).then(result =>{
            console.log(result);
            refreshContract();
        });
    });
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
