pragma solidity >=0.4.24;

// Import the library 'Roles'
import "./Roles.sol";

// Define a contract 'BidderRole' to manage this role - add, remove, check
contract BidderRole {
  using Roles for Roles.Role;

  // Define 2 events, one for Adding, and other for Removing
  event BidderAdded(address indexed account);
  event BidderRemoved(address indexed account);

  // Define a struct 'bidder' by inheriting from 'Roles' library, struct Role
  Roles.Role private bidders;
  // In the constructor make the address that deploys this contract the 1st government
  constructor() public {
    _addBidder(msg.sender);
  }

  // Define a modifier that checks to see if msg.sender has the appropriate role
  modifier onlyBidder() {
     require(isBidder(msg.sender));
    _;
  }

  // Define a function 'isBidder' to check this role
  function isBidder(address account) public view returns (bool) {
    return bidders.has(account);
  }

  // Define a function 'addBidder' that adds this role
  function addBidder(address account) public onlyBidder {
    _addBidder(account);
  }

  // Define a function 'renounceBidder' to renounce this role
  function renounceBidder() public {
    _removeBidder(msg.sender);
  }

  // Define an internal function '_addBidder' to add this role, called by 'addBidder'
  function _addBidder(address account) internal {
    bidders.add(account);
    emit BidderAdded(account);
  }

  // Define an internal function '_removeBidder' to remove this role, called by 'removeBidder'
  function _removeBidder(address account) internal {
    bidders.remove(account);
    emit BidderRemoved(account);
  }
}
