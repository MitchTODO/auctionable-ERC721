var Tender = artifacts.require('Tender');

function logicTest(start, end , currentTime) {
  return currentTime >= start && currentTime <= end;
}


contract('Tender', accounts => {

    const account_one = accounts[0];
    const account_two = accounts[1];
    const account_three = accounts[2];
    const account_four = accounts[3];

    const symbol = "GT";
    const name = "GovernmentTender";

    const minBidList = [30,50,90,100,110,120];

    var endTime;
    var openTime;

    describe('Testing token auction', function () {
        beforeEach(async function () {

            let seconds = Math.round(Date.now() / 1000);
            openTime = seconds; // Start auction time

            endTime = openTime + 10;
            // Wait for openTime before each test
            while(true){
              if (logicTest(openTime,endTime,(Math.round(Date.now() / 1000)))){
                break;
              }
            }
            this.contract = await Tender.new(name,symbol,{from: account_one});

            let status = await this.contract.mint(account_one,0,minBidList[0],openTime,endTime,{from:account_one});
            let mint2 = await this.contract.mint(account_one,1,minBidList[0],openTime,endTime,{from:account_one});
            let isOpen = logicTest(openTime,endTime,(Math.round(Date.now() / 1000)));
        })


        it('Making a bid', async function () {

          await new Promise(resolve => setTimeout(resolve, 1000));

          await this.contract.addBid(0, 20,"Bid one",{from:account_two} );
          await this.contract.addBid(0, 40,"Bid two",{from:account_three} );
          await this.contract.addBid(0, 60,"Bid three",{from:account_four} );

          let top = await this.contract.getTop(0,3);

          let bidInfo = await this.contract.getBidInfo(0,account_two);

          let bidPrice = parseInt(bidInfo.price)

          assert.equal(bidInfo.bidder,account_two,"bidder address is incorrect");
          assert.equal(bidInfo.contractBudget,"Bid one","Contract budget is incorrect");
          assert.equal(bidPrice,20,"Bid price is incorrect");

        })


        it('Removing a bid',async function() {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.contract.addBid(0, 30,"Bid one",{from:account_two} );
          await this.contract.addBid(0,20,"The best bid",{from:account_three});

          let bidInfo = await this.contract.getBidInfo(0,account_three);
          let bidPrice = parseInt(bidInfo.price)


          assert.equal(bidPrice,20,"Faild to remove bid; Bid price dosn't match ");

          await this.contract.removeBid(0,{from:account_three});

          let top = await this.contract.getTop(0,1);


          let bidInfoBack = await this.contract.getBidInfo(0,account_three);
          assert.equal(parseInt(bidInfoBack.price),"0","bid price was not removed");
          assert.equal(bidInfoBack.contractBudget,"","bid contract budget");

        })

        it('Updating bid', async function() {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.contract.addBid(0,30,"Bid one",{from:account_two});
          let oldBid = await this.contract.getBidInfo(0,account_two);

          await this.contract.updateBid(0,500,"Bid Two",{from:account_two});
          let bid = await this.contract.getBidInfo(0,account_two);

          assert.equal(parseInt(bid.price),500,"New price was not updated");
          assert.equal(bid.contractBudget,"Bid Two","New contract budget was not updated");
          assert.equal(bid.bidder,account_two,"Bidder not equal two msg.sender");
        })

        it('Pick a winner', async function() {
          await new Promise(resolve => setTimeout(resolve, 1000));

          await this.contract.addBid(0,20,"Best Bid",{from:account_four});
          await new Promise(resolve => setTimeout(resolve, 11000));

          let top = await this.contract.getTop(0,1);
          await this.contract.chooseWinner(0,top[0],{from:account_one})

          let winner = await this.contract.getWinner(0);
          assert.equal(winner,account_four,"Incorrect winner");

          let closed = await this.contract.hasClosed(0);
          let isOpen = await this.contract.isOpen(0);
          let notSign = await this.contract.isSigned(0);
          assert.equal(notSign,false,"Token should be not signed");

          await this.contract.signContract(0,{from:account_one});
          await this.contract.signContract(0,{from:account_four});
          let sign = await this.contract.isSigned(0);
          assert.equal(sign,true,"Token should be signed");

          await this.contract.approve(account_four,0,{from:account_one});
          await this.contract.safeTransferFrom(account_one,account_four,0,{from:account_four});

          let checkOwner = await this.contract.ownerOf(0);

          assert.equal(checkOwner,account_four,"New owner is not correct");
        })

        it('Trying a double bid', async function() {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try{
            await this.contract.addBid(0, 20,"Bid one",{from:account_two} );
            await this.contract.addBid(0, 20,"Bid one",{from:account_two} );
          }catch(error) {
            console.log(error);
          }
        })

        it('Trying a ')


    });


})
