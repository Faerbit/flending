pragma solidity ^0.4.6;

import "./strings.sol";

// time is always in seconds
// money is always in wei
contract Lending {
    using strings for *;
    address public owner;

    function Lending () {
        owner = msg.sender;
    }

    // lending policy 
    struct Policy {
        string name;
        string category;
        uint maxTimeFrame;
        uint lendingFee; // wei per Second
        uint minLendingFee;
        uint depositAmount;
        uint overdueFee; // wei per Second
        uint maxOverdue;
        bool relendingAllowed;
    }

    Policy[] public policies;

    function policiesLength() constant returns (uint) {
        return policies.length;
    }
   
    struct LendItem {
        uint itemId;
        uint policyId;
        address lender;
        uint lendEnd;
        uint timeFrame;
        bool confirmed;
    }

    LendItem[] public lendItems;

    function lendItemsLength() constant returns (uint) {
        return lendItems.length;
    }

    function newPolicy(string name, string category, uint maxTimeFrame,
                       uint lendingFee, uint minLendingFee, uint depositAmount,
                       uint overdueFee, uint maxOverdue,
                       bool relendingAllowed) {
        require(msg.sender == owner);
        policies.push(Policy(name, category, maxTimeFrame, lendingFee,
                             minLendingFee, depositAmount, overdueFee,
                             maxOverdue, relendingAllowed));
    }

    function getPolicy(string pName) constant returns (uint) {
        for(uint i = 0; i<policies.length; i++) {
            if (strings.equals(policies[i].name.toSlice(), pName.toSlice())) {
                return i;
            }
        }
        // throw if not found
        revert();
    }

    function lendRequest(uint itemId, string category, uint timeFrame,
                         uint policyId) payable {
        require(strings.equals(category.toSlice(),
                               policies[policyId].category.toSlice()));
        require(timeFrame < policies[policyId].maxTimeFrame);
        require(msg.value >= calcPreLendPayment(policyId, timeFrame));
        lendItems.push(LendItem(itemId, policyId, msg.sender, block.timestamp,
                                block.timestamp + timeFrame, false));
    }

    function min(uint a, uint b) internal returns (uint) {
        if(a<b) {
            return a;
        }
        else {
            return b;
        }
    }

    function max(uint a, uint b) internal returns (uint) {
        if(a>b) {
            return a;
        }
        else {
            return b;
        }
    }

    function calcPreLendPayment (uint policyId, uint timeFrame)
        constant returns (uint) {
        return (max(policies[policyId].minLendingFee,
                    timeFrame * policies[policyId].lendingFee)
                    + policies[policyId].depositAmount);
    }

    function calcPostLendPayback(uint lendId) constant returns (int) {
        uint overdue = 0;
        if (block.timestamp > lendItems[lendId].lendEnd) {
            overdue = block.timestamp - lendItems[lendId].lendEnd;
        }
        return int(policies[lendItems[lendId].policyId].depositAmount) -
            int(min(policies[lendItems[lendId].policyId].maxOverdue,
                overdue * policies[lendItems[lendId].policyId].overdueFee));

    }

    function lendConfirm(uint lendRequestId) {
        require(msg.sender == owner);
        require(lendItems[lendRequestId].confirmed == false);
        require(lendRequestId < lendItems.length);
        lendItems[lendRequestId].confirmed = true;
    }

    function lendDecline(uint lendRequestId) {
        require(msg.sender == owner);
        require(lendItems[lendRequestId].confirmed == false);
        lendItems[lendRequestId].lender.transfer(calcPreLendPayment(
            lendItems[lendRequestId].policyId,
            lendItems[lendRequestId].timeFrame));
    }

    function lendComplete(uint lendRequestId) {
        require(msg.sender == owner);
        require(lendRequestId < lendItems.length);
        int payback = calcPostLendPayback(lendRequestId);
        if (payback > 0) {
            lendItems[lendRequestId].lender.transfer(uint(payback));
        }
        lendItems[lendRequestId] = lendItems[lendItems.length - 1];
        lendItems.length--;
    }

    // swarm address to current item sqlite db file
    string currentDb;

    function setCurrentDb(string val) {
        require(msg.sender == owner);
        currentDb = val;
    }

    function getCurrentDb() constant returns (string) {
        return currentDb;
    }


    function kill() {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }
}
