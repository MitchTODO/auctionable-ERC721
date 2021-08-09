# Auction-able ERC721

Extending the ERC721 standard allowing for an asset to be auctioned through its own contract, eliminating the need for third party auction sites.

## About

This is a on-going project and as of now this is just a PoC more work needs to be done.

This project first started off as a procurement smart contract but rename to auction-able ERC721. Contract design could be applied to different type of applications not just procurement. Code design is meant to be boiler plate. Allowing for easy changes.

## Quick Start

### Pre-requisities

NodeJs v14.16.1 with npm

Truffle v5.3.3

Ganache

### Install Node libarays

Open a terminal and cd into the project directory. Install libraries with the following command.

      npm install

### Compiling contracts

Within the same terminal & project directory run.

      truffle compile

### Launch Ganache & Migrate the contracts

      truffle migrate -development --reset

### Testing the contracts      

      truffle test

---

## Architecture

Extending the ERC721 standard gives tokens the ability to be auctioned without removing or destroying existing functionality.

### Minting

Compared to the existing minting function takes in three additional parameters.

`uint256 _minBid` : Lowest bid amount

`uint256 _openingTime` : Auction opening time (Epoch)

`uint256 _closingTime` : Auction closing time (Epoch)

Times checks on are done preventing an impossible auction.

```js
require(_openingTime >= block.timestamp, "Cant start auction opening time is before current time");
require(_closingTime > _openingTime, "Cant start auction opening time is not before closing time");
```
Auction struct contains features associated on creating and tracking an auction.

```js
/*556 - 573*/
mapping(uint256 => Auction) private auction;// tokenID to tender auction information

address constant GUARD = address(1);        // Common address used to map addresses based on best bid

struct Auction {
  uint256 minBid;                           // limit on min bid
  uint256 openingTime;                      // opening auction time in epoche
  uint256 closingTime;                      // closing auction time in epoche

  mapping(address => Bid) bids;             // Mapping of bids to address (msg.sender of the bid)  
  mapping(address => address) _nextBidders; // Mapping of address to address (Order of bids)
  uint256 listSize;                         // How many bidders

  address contractWinner;                   // Winner of the auction
  MultiSign sign;                           // Agreement between buyer and seller
}
```

When a token is minted an struct is constructed and mapping to the `tokeID`.

```js
/*924 - 930*/

Auction memory newTokenAuction;
newTokenAuction.minBid = _minBid;
newTokenAuction.openingTime = _openingTime;
newTokenAuction.closingTime = _closingTime;

auction[tokenId] = newTokenAuction;           // Map new created auction to uint256 tokenID
auction[tokenId]._nextBidders[GUARD] = GUARD; // Used to manage and order bids
```

### Auction availability

During the minting function start and end times are used to control how long the auction should last. Two base availability functions are used by modifiers to enforce the auction availability. Functions are also callable.

```js
/*847 - 863*/

function isOpen(uint256 token)
public
view
returns(bool open)
{
  Auction memory _auction = auction[token];
  return (block.timestamp >= _auction.openingTime && block.timestamp <= _auction.closingTime);
}

function hasClosed(uint256 token)
public
view
returns (bool)
{
    Auction memory _auction = auction[token];
    return block.timestamp > _auction.closingTime;
}
```

```js
/*616 - 623*/

modifier onlyWhileOpen(uint256 token) {
    require(isOpen(token), "Auction not open");
    _;
}
modifier onlyWhileClosed(uint256 token) {
  require(hasClosed(token), "Auction is still open");
  _;
}
```

### Bidding & Bid management

Three public functions allow for the creation, updating and removing of the bid during auction time. Additional functions are used to keep track of the best bid. Currently best bid is the lowest bid. This might seem backwards but do to the way procurement work best bid is the lowest bid.

### Add a Bid

`addBid` function adds a new bid to the auction given the auction is open. Taking three parameters.

*<u> Parameters </u>*

  `uint256 token` :  Id of token to bid on

  `uint256 _price` : Price of bid

  `string _contractBudget` : Contract budget related to the bid.

*<u> Details </u>*

 Bid struct makes up components of the bid. Each bid is mapped back to the address of the sender. The bid mapping exist within the auction struct (nested mapping).

```js
// create new bid within token auction
Bid memory newBid;
newBid.price = _price;
newBid.contractBudget = _contractBudget;
newBid.bidder = msg.sender;
// Add new bid
auction[token].bids[msg.sender] = newBid;
```

Bids are then checked and sorted by price. Instead of then keeping a list of bids we use a mapping to keep order of best bid. This is accomplished by using the sender address mapped to the next best bid address.

```js
address index = _findIndex(token,_price);
// Update mapping key and value pairs
auction[token]._nextBidders[msg.sender] = auction[token]._nextBidders[index];
auction[token]._nextBidders[index] = msg.sender;
// increase auction size
auction[token].listSize++;
```

### Updating a Bid

`updateBid` function updates an existing bid.

*<u> Parameters </u>*

`uint256 token` :  Id of token to bid on

`uint256 newPrice` : Updated price of bid

`string newContractBudget` : Updated contract budget related to the bid.

*<u> Details </u>*

1. Checks if msg.sender has a existing bid on token

```js
require(auction[token]._nextBidders[msg.sender] != address(0));
```

2. Checks if bid order should be updated

     **No** : Update bid price & budget

     **Yes** : call `removebid` & `addbid` allowing for the update of the bid order.

    ```js
    address prevBidder = _findPrevBidder(token,msg.sender);
    address nextBidder = auction[token]._nextBidders[msg.sender];
    if(_verifyIndex(token,prevBidder,newPrice,msg.sender)){ // check if index is the same
       auction[token].bids[msg.sender].price = newPrice;
       auction[token].bids[msg.sender].contractBudget = newContractBudget;
       // no need to update bidder address
    }else{ // update with new location
      removeBid(token);
      addBid(token, newPrice, newContractBudget);
    }
    ```

### Removing a Bid


`removeBid` function removes an existing bid from the auction.

*<u> Parameters </u>*

`uint256 token` id of token to remove bid

*<u> Details </u>*

Only two steps are need to fully remove a bid from a token auction.

1. Remove the bid from the bid order.

```js
address prevBidder = _findPrevBidder(token,msg.sender);
auction[token]._nextBidders[prevBidder] =  auction[token]._nextBidders[msg.sender];
auction[token]._nextBidders[msg.sender] = address(0);
```

2. Assigning bid variables back default.

```js
auction[token].bids[msg.sender].price = 0;
auction[token].bids[msg.sender].bidder = address(0);
auction[token].bids[msg.sender].contractBudget = "";
```


### Bid management

Keeping list in Solidity can have limitations. For efficiency a mapping is used that links bids together based on price. Mapping variable can be found in the auction struct.

 `mapping(address => address) _nextBidders;`

 Four utility functions are used to handle the ordering of bids.

**_verifyIndex**

 Based on bid price, checks if the position of the bid is correct.

 *<u>Parameters</u>*

- `uint256 token`     : Token id of auction

- `address prevBid`   : Previous bidder address

- `uint256 newValue`  : New bid price

- `address nextBid`   : New bidder address

*<u>Returns</u>*

- `bool`              : Bool representing if the new bid price is correctly index between previous bidder and new bidder addresses.


 **_findIndex**

 Finds index of bid based on price.

 *<u>Parameters</u>*

- `uint256 token`     : Token id of auction

- `uint256 newValue`  : Position (index) to find based on value (bid price)

 *<u>Returns</u>*

 - `address`          : Address associated with input value

 **_isPrevBidder**

 Verifies previous bidder position

 *<u>Parameters</u>*

- `uint256 token`       : Token id of auction

- `address bidder`      : Address of bidder

- `address prevBidder`  : Address of previous bidder

 *<u>Returns</u>*

 - `bool`               : Check between bidder and prevBidder using mapping from auction

 **_findPrevBidder**

 Returns address of previous bidder of given another bidder address.

 *<u>Parameters</u>*

- `uint256 token`     : Token id of auction

- `address bidder`    : Address of bidder

 *<u>Returns</u>*

 - `address`          : Address of previous bidder using input bid address

### Looking at bids

`GetTop` returns a sorted list of address by min bid price (procurement).

*<u>Parameters</u>*

- `uint256 token`     : Token id of auction

- `uint256 k`         : Amount of address to return (first position will be the best bid)

*<u>Returns</u>*

- `address[] memory` :  sorted list of address

 Each address can then be called with `getBidInfo` to get more details about each bid.

### Choose a winner

A winner is chosen by the contract owner and only allowed when the auction is over. If contract owner is not desired, an access control could be implemented. Allowing for other address to choose a winner.

`chooseWinner` allows for a winner to be chosen.

 *<u>Parameters</u>*

 - `uint256 token`    : Token id of auction

 - `address bidder`   : Bidder of address to be auction winner

  *<u>Emits</u>*

- `Winner( token, bidder)` : Emit winner event

### MultiSignure

MultiSigning between two parties confirms the agreement of the auctioned token. When both parties have signed, contract owner can then approve the winner to take ownership of the token.

`signContract` allows for token to be signed by both parties after winner is picked.

```js
/*
  Multi Sign functions
*/

function approve(address to, uint256 tokenId)
public
  _isBidderSign(tokenId)
  _isOwnerSign(tokenId)
{
  super.approve(to, tokenId);
  emit Approved(tokenId,to);
}

// TODO: Add event when both party's finished signing
function signContract(uint256 token)
public
onlyWhileClosed(token)
{
  require(auction[token].contractWinner != address(0x0),"Winning has not been choosen.");
  require(auction[token].contractWinner == msg.sender || _owner == msg.sender,"Address not assocated with token");
  if (msg.sender == _owner) {
    auction[token].sign.owner = true;
  }else{
    auction[token].sign.bidder = true;
  }
}
```
