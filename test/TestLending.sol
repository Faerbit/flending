pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Lending.sol";

contract TestLending {

    function testInitalPolicyLength() {
        Lending lending = Lending(DeployedAddresses.Lending());

        uint expected = 0;

        Assert.equal(lending.policiesLength(), expected, "There should be no policies at the start");
    }

    /*function testNewPolicy() {
        Lending lending = Lending(DeployedAddresses.Lending());

        lending.newPolicy("def", "stuff", 10, 10, 10, 10, 10, 10, false, {from:accounts[0]});
        uint expected = 1;

        Assert.equal(lending.policiesLength(), expected, "There should be one policy after newPolicy()");
    }*/
}
