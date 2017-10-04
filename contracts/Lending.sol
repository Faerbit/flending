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

    enum LendStatus { Requested, Accepted, Confirmed }
   
    struct LendItem {
        uint itemId;
        uint policyId;
        address lender;
        uint lendEnd;
        uint timeFrame;
        LendStatus status;
        address nextLender;
        uint nextLendEnd;
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
                lendItems[uint(lendRequestId)].nextLendEnd = block.timestamp + timeFrame;
                lendItems[uint(lendRequestId)].nextTimeFrame = timeFrame;
                lendItems[uint(lendRequestId)].status = LendStatus.Requested;
            }
            else {
                revert();
            }
        }
        else {
            lendItems.push(LendItem(itemId, policyId, msg.sender,
                block.timestamp + timeFrame, block.timestamp, LendStatus.Requested,
                msg.sender, 0, 0));
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

    function firstLendAccept(uint lendRequestId) internal {
        require(msg.sender == owner);
        require(lendItems[lendRequestId].status == LendStatus.Requested);
        lendItems[lendRequestId].status = LendStatus.Accepted;
    }

    function lendAccept(uint lendRequestId) {
        require(lendRequestId < lendItems.length);
        if (policies[lendItems[lendRequestId].policyId].relendingAllowed) {
            if (lendItems[lendRequestId].lender ==
                lendItems[lendRequestId].nextLender && msg.sender == owner) {
                firstLendAccept(lendRequestId);
            }
            else {
                require(msg.sender == lendItems[lendRequestId].lender);
                require(lendItems[lendRequestId].status == LendStatus.Requested);
                lendItems[lendRequestId].status = LendStatus.Accepted;
            }
        }
        else {
            firstLendAccept(lendRequestId);
        }
    }

    function lendConfirm(uint lendRequestId) {
        require(lendRequestId < lendItems.length);
        require(lendItems[lendRequestId].status == LendStatus.Accepted);
        if (lendItems[lendRequestId].lender !=
                    lendItems[lendRequestId].nextLender) {
            require(msg.sender == lendItems[lendRequestId].nextLender);
            int payback = calcPostLendPayback(lendRequestId);
            if (payback > 0) {
                // deactivated because it's buggy
                //lendItems[lendRequestId].lender.transfer(uint(payback));
            }
            lendItems[lendRequestId].lender =
                lendItems[lendRequestId].nextLender;
            lendItems[lendRequestId].timeFrame =
                lendItems[lendRequestId].nextTimeFrame;
            lendItems[lendRequestId].lendEnd =
                lendItems[lendRequestId].nextLendEnd;
            lendItems[lendRequestId].nextLendEnd = 0;
            lendItems[lendRequestId].nextTimeFrame = 0;
            lendItems[lendRequestId].status = LendStatus.Confirmed;
        }
        else {
            require(msg.sender == lendItems[lendRequestId].lender);
            lendItems[lendRequestId].status = LendStatus.Confirmed;
        }
    }

    function removeLend(uint lendRequestId) internal {
        lendItems[lendRequestId] = lendItems[lendItems.length - 1];
        lendItems.length--;
    }

    function firstLendDecline(uint lendRequestId) internal {
        require(msg.sender == owner);
        require(lendItems[lendRequestId].status == LendStatus.Requested);
        uint payback = calcPreLendPayment(
            lendItems[lendRequestId].policyId,
            lendItems[lendRequestId].timeFrame);
        // deactivated because it's buggy
        //lendItems[lendRequestId].lender.transfer(payback);
        removeLend(lendRequestId);
    }

    function lendDecline(uint lendRequestId) {
        require(lendRequestId < lendItems.length);
        if (policies[lendItems[lendRequestId].policyId].relendingAllowed) {
            if (lendItems[lendRequestId].lender == 
                lendItems[lendRequestId].nextLender && msg.sender == owner) {
                firstLendDecline(lendRequestId);
            }
            else {
                require(msg.sender == 
                    lendItems[lendRequestId].lender);
                require(lendItems[lendRequestId].status == LendStatus.Requested);
                uint payback = calcPreLendPayment(
                    lendItems[lendRequestId].policyId,
                    lendItems[lendRequestId].nextTimeFrame);
                // deactivated because it's buggy
                //lendItems[lendRequestId].nextLender.transfer(payback);
                lendItems[lendRequestId].nextLender = 
                    lendItems[lendRequestId].lender;
                lendItems[lendRequestId].nextTimeFrame = 0;
                lendItems[lendRequestId].status = LendStatus.Confirmed;
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
            // deactivated because it's buggy
            //lendItems[lendRequestId].lender.transfer(uint(payback));
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
