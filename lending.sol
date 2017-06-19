pragma solidity ^0.4.11;

// time is always in seconds
// money is always in wei
contract Lending {
    address owner;

    // lending policy 
    struct Policy {
        uint[2] idRange;
        uint maxTimeFrame;
        uint lendingFee;
        uint depositAmount;
        uint overdueTickMoneyRate;
        uint overdueTickTimeRate;
        uint maxOverdue;
        bool relendingAllowed;
    }

    mapping(string => Policy) policies;
   
    struct LendItem {
        string policyId;
        uint timeFrame;
        bool valid;
    }

    mapping(address => mapping(uint => LendItem)) lendeesWithItems;

    function newPolicy(string name, Policy policy) {
        if (msg.sender == owner) {
            policies[name] = policy;
        }
    }

    function registerLendee() {
        // if lendee is not registered
        if (lendeesWithItems[msg.sender] == address(0x0)) {
            lendeesWithItems[msg.sender] = mapping(uint => LendItem);
        }
    }

    function lendRequest(uint itemId, uint timeFrame, string policy) payable {
        // if lendee is not registered
        if (lendeesWithItems[msg.sender] != address(0x0)) {
            if (policies[policy] != address(0x0)) {
                if (policies[policy].idRange[0] <= itemId 
                    <= policies[policy].idRange[1]
                   && timeFrame < policies[policy].maxTimeFrame) {
                    lendeesWithItems[msg.sender][itemId] 
                        = LendItem(policy, timeFrame, false);
                }
            }
        }
    }

    function lendConfirm(address lendee, uint itemId) {
        if (msg.sender == owner) {
            // if lendee is not registered
            if (lendeesWithItems[lendee] != address(0x0)) {
                if (lendeesWithItems[lendee][itemId] != address(0x0) {
                    lendeesWithItems[lendee][itemId].valid = true;
                }
            }
        }
    }

    function lendComplete(address lendee, uint itemId) {
        if (msg.sender == owner) {
            // if lendee is not registered
            if (lendeesWithItems[lendee] != address(0x0)) {
                if (lendeesWithItems[lendee][itemId] != address(0x0) {
                    lendeesWithItems[lendee].pop(itemId);
                }
            }
        }
    }


    function kill() {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }
}
