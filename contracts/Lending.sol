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
        address nextLender;
        uint nextTimeFrame;
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
        // revert if not found
        revert();
    }

    function checkLended(uint itemId) constant returns (int) {
        for(uint i = 0; i<lendItems.length; i++) {
            if (lendItems[i].itemId == itemId) {
                return int(i);
            }
        }
        // return false if not found
        return -1;
    }

    function lendRequest(uint itemId, string category, uint timeFrame,
                         uint policyId) payable {
        require(strings.equals(category.toSlice(),
                               policies[policyId].category.toSlice()));
        require(timeFrame < policies[policyId].maxTimeFrame);
        require(msg.value >= calcPreLendPayment(policyId, timeFrame));
        int lendRequestId = checkLended(itemId);
        if (lendRequestId > -1) {
            if (policies[policyId].relendingAllowed) {
                lendItems[uint(lendRequestId)].nextLender = msg.sender;
                lendItems[uint(lendRequestId)].nextTimeFrame = timeFrame;
            }
            else {
                revert();
            }
        }
        else {
            lendItems.push(LendItem(itemId, policyId, msg.sender,
                block.timestamp, block.timestamp + timeFrame, false,
                msg.sender, 0));
        }
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

    function firstLendConfirm(uint lendRequestId) internal {
        require(msg.sender == owner);
        require(lendItems[lendRequestId].confirmed == false);
        lendItems[lendRequestId].confirmed = true;
    }

    function lendConfirm(uint lendRequestId) {
        require(lendRequestId < lendItems.length);
        if (policies[lendItems[lendRequestId].policyId].relendingAllowed) {
            if (lendItems[lendRequestId].lender ==
                lendItems[lendRequestId].nextLender) {
                firstLendConfirm(lendRequestId);
            }
            else {
                require(msg.sender == lendItems[lendRequestId].lender);
                require(lendItems[lendRequestId].confirmed == true);
                lendItems[lendRequestId].lender =
                    lendItems[lendRequestId].nextLender;
                lendItems[lendRequestId].timeFrame =
                    lendItems[lendRequestId].nextTimeFrame;
                lendItems[lendRequestId].lendEnd =
                    block.timestamp + lendItems[lendRequestId].nextTimeFrame;
                lendItems[lendRequestId].nextTimeFrame = 0;
            }
        }
        else {
            firstLendConfirm(lendRequestId);
        }
    }

    function removeLend(uint lendRequestId) internal {
        lendItems[lendRequestId] = lendItems[lendItems.length - 1];
        lendItems.length--;
    }

    function firstLendDecline(uint lendRequestId) internal {
        require(msg.sender == owner);
        require(lendItems[lendRequestId].confirmed == false);
        uint payback = calcPreLendPayment(
            lendItems[lendRequestId].policyId,
            lendItems[lendRequestId].timeFrame);
        lendItems[lendRequestId].lender.transfer(payback);
        removeLend(lendRequestId);
    }

    function lendDecline(uint lendRequestId) {
        require(lendRequestId < lendItems.length);
        if (policies[lendItems[lendRequestId].policyId].relendingAllowed) {
            if (lendItems[lendRequestId].lender == 
                lendItems[lendRequestId].nextLender) {
                firstLendDecline(lendRequestId);
            }
            else {
                require(msg.sender == 
                    lendItems[lendRequestId].lender);
                require(lendItems[lendRequestId].confirmed == true);
                lendItems[lendRequestId].nextLender = 
                lendItems[lendRequestId].nextLender = 
                    lendItems[lendRequestId].lender;
                lendItems[lendRequestId].nextTimeFrame = 0;
            }
        }
        else {
            firstLendDecline(lendRequestId);
        }
    }

    function lendComplete(uint lendRequestId) {
        require(msg.sender == owner);
        require(lendRequestId < lendItems.length);
        int payback = calcPostLendPayback(lendRequestId);
        if (payback > 0) {
            lendItems[lendRequestId].lender.transfer(uint(payback));
        }
        removeLend(lendRequestId);
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
