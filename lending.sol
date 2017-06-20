pragma solidity ^0.4.6;

// time is always in seconds
// money is always in wei
contract Lending {
    using strings for *;
    address owner;

    function Lending () {
        owner = msg.sender;
    }

    // lending policy 
    struct Policy {
        string name;
        uint[2] idRange;
        uint maxTimeFrame;
        uint lendingFee;
        uint depositAmount;
        uint overdueTickMoneyRate;
        uint overdueTickTimeRate;
        uint maxOverdue;
        bool relendingAllowed;
    }

    Policy[] policies;
   
    struct LendItem {
        address lender;
        uint policyId;
        uint lendEnd;
        bool confirmed;
    }

    LendItem[] public lendItems;

    function newPolicy(string name, uint idStart, uint idEnd, uint maxTimeFrame,
                       uint lendingFee, uint depositAmount,
                       uint overdueTickMoneyRate, uint overdueTickTimeRate,
                       uint maxOverdue, bool relendingAllowed) {
        if (msg.sender == owner) {
            uint[2] memory idRange;
            idRange[0] = idStart;
            idRange[1] = idEnd;
            policies.push(Policy(name, idRange, maxTimeFrame, lendingFee,
                                 depositAmount, overdueTickMoneyRate,
                                 overdueTickTimeRate, maxOverdue, 
                                 relendingAllowed));
        }
    }

    function getPolicy(string pName) constant returns (uint) {
        for(uint i = 0; i<policies.length; i++) {
            if (strings.equals(policies[i].name.toSlice(), pName.toSlice())) {
                return i;
            }
        }
        // throw if not found
        throw;
    }

    function lendRequest(uint itemId, uint timeFrame, uint policyId) payable {
        if (policies[policyId].idRange[0] <= itemId
            && itemId <= policies[policyId].idRange[1]
            && timeFrame < policies[policyId].maxTimeFrame) {
               // TODO check payed money
            lendItems.push(
                LendItem(msg.sender, policyId, block.timestamp + timeFrame,
                         false));
        }
    }

    function getUnconfirmedLendItems() constant internal returns (LendItem[]) {
        LendItem[] memory ret;
        for (uint i = 0; i<lendItems.length; i++) {
            if (lendItems[i].confirmed == false) {
                ret[i] = lendItems[i];
            }
        }
        return ret;
    }

    function lendConfirm(uint lendRequestId) {
        if (msg.sender == owner) {
            lendItems[lendRequestId].confirmed = true;
        }
    }

    function getConfirmedLendItems() constant internal returns (LendItem[]) {
        LendItem[] memory ret;
        for (uint i = 0; i<lendItems.length; i++) {
            if (lendItems[i].confirmed == true) {
                ret[i] = lendItems[i];
            }
        }
        return ret;
    }

    function lendComplete(uint lendRequestId) {
        if (msg.sender == owner) {
            // TODO pay remainig money back
            //lendItems[lendRequestId] = lendItems[lendItems.length];
            lendItems.length--;
        }
    }


    function kill() {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }
}
