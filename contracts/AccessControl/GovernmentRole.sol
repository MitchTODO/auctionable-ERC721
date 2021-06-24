pragma solidity >=0.4.24;

// Import the library 'Roles'
import "./Roles.sol";

// Define a contract 'GovernmentrRole' to manage this role - add, remove, check
contract GovernmentRole {
  using Roles for Roles.Role;

  // Define 2 events, one for Adding, and other for Removing
  event GovernmentAdded(address indexed account);
  event GovernmentRemoved(address indexed account);

  // Define a struct 'government' by inheriting from 'Roles' library, struct Role
  Roles.Role private government;
  // In the constructor make the address that deploys this contract the 1st government
  constructor() public {
    _addGovernment(msg.sender);
  }

  // Define a modifier that checks to see if msg.sender has the appropriate role
  modifier onlyGovernment() {
     require(isGovernment(msg.sender));
    _;
  }

  // Define a function 'isGovernmentr' to check this role
  function isGovernment(address account) public view returns (bool) {
    return government.has(account);
  }

  // Define a function 'addGovernmentr' that adds this role
  function addGovernment(address account) public onlyGovernment {
    _addGovernment(account);
  }

  // Define a function 'renounceGovernmentr' to renounce this role
  function renounceGovernment() public {
    _removeGovernment(msg.sender);
  }

  // Define an internal function '_addGovernmentr' to add this role, called by 'addGovernmentr'
  function _addGovernment(address account) internal {
    government.add(account);
    emit GovernmentAdded(account);
  }

  // Define an internal function '_removeGovernmentr' to remove this role, called by 'removeGovernmentr'
  function _removeGovernment(address account) internal {
    government.remove(account);
    emit GovernmentRemoved(account);
  }
}
