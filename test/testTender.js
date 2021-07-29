var Tender = artifacts.require('Tender');

function logicTest(start, end , currentTime) {
  return currentTime >= start && currentTime <= end;
}


contract('Tender', accounts => {

    const account_one = accounts[0];
    const account_two = accounts[1];
    const account_three = accounts[2];

    const symbol = "GT";
    const name = "GovernmentTender";

    const minBidList = [30,50,90,100,110,120];

    var openTime; // Start auction time
    var endTime;



    describe('Match erc721 spec', function () {
        beforeEach(async function () {
            this.contract = await Tender.new(name,symbol,{from: account_one});

            let seconds = Math.round(Date.now() / 1000);
            openTime = seconds; // Start auction time

            endTime = openTime + 10;

            let status = await this.contract.mint(account_one,0,minBidList[0],openTime,endTime,{from:account_one});

            let isOpen = logicTest(openTime,endTime,(Math.round(Date.now() / 1000)));
        })

        it('Checking tokenURL, should return full tokenURI', async function() {
          let tokenURI = await this.contract.tokenURI(0);

          assert.equal(tokenURI,"https://github.com/MitchTODO/0","Incorrect tokenURI")

        })

        it('Checking token supply, should return total supply', async function () {
          let amount = await this.contract.totalSupply();

          assert.equal(parseInt(amount),1,"Incorrect token amount for total supply");
        })

        it('Checking token balance of a address, should get token balance', async function () {
          let balance = await this.contract.balanceOf(account_one);

          assert.equal(parseInt(balance), 1, "Incorrect token balance");
        })

        it('Checking token auction info', async function () {
          let auctionInfo = await this.contract.getTokenAuctionInfo(0);

          let minBid = parseInt(auctionInfo.minBid);
          let listSize = parseInt(auctionInfo.listSize);
          let startDate = parseInt(auctionInfo.openingTime);
          let endDate = parseInt(auctionInfo.closingTime);
          let isAvailable = auctionInfo.isAvailable;

          assert.equal(minBid, 30 , "Min bid is incorrect");
          assert.equal(startDate, openTime, "Opening time is incorrect");
          assert.equal(endDate, endTime,"Closing time is incorrect");``

        })

        

    });
})
