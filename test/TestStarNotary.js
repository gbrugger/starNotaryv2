const StarNotary = artifacts.require("StarNotary");

let accounts, owner;

contract("StarNotary", accs => {
  accounts = accs;
  owner = accounts[0];
});

it("can create a star", async () => {
  const tokenId = 1;
  const instance = await StarNotary.deployed();
  const starName = "Awesome Star!";
  await instance.createStar(starName, tokenId, { from: owner });
  assert.equal(await instance.tokenIdToStarInfo.call(tokenId), starName);
});

it("lets user1 put up their star for sale", async () => {
  const tokenId = 2;
  const instance = await StarNotary.deployed();
  const user1 = accounts[1];
  const starPrice = web3.utils.toWei("0.01", "ether");
  const starName = "Awesome Star 2!";
  await instance.createStar(starName, tokenId, { from: user1 });
  await instance.putStarUpForSale(tokenId, starPrice, { from: user1 });
  assert.equal(await instance.starsForSale.call(tokenId), starPrice);
});

it("lets user1 get the funds after the sale", async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 3;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".05", "ether");
  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  await instance.approve(user2, starId, {
    from: user1,
  });
  let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
  const receipt = await instance.buyStar(starId, {
    from: user2,
    value: balance,
    maxFeePerGas: 100,
  });
  let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);

  let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
  let value2 = Number(balanceOfUser1AfterTransaction);
  assert.equal(value1, value2);
});

it("lets user2 buy a star, if it is put up for sale", async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 4;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".05", "ether");
  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
  await instance.approve(user2, starId, {
    from: user1,
    gasPrice: 2000000,
    maxFeePerGas: 100000,
  });
  await instance.buyStar(starId, { from: user2, value: balance });
  assert.equal(await instance.ownerOf.call(starId), user2);
});

it("lets user2 buy a star and decreases its balance in ether", async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 5;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".01", "ether");
  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  await instance.approve(user2, starId, {
    from: user1,
  });
  const BN = web3.utils.BN;
  let gasPrice = new BN(web3.utils.toWei("10", "gwei"));
  const balanceOfUser2BeforeTransaction = new BN(
    await web3.eth.getBalance(user2)
  );
  const receipt = await instance.buyStar(starId, {
    from: user2,
    value: balance,
    gasPrice: gasPrice,
    // maxFeePerGas: 7,
  });

  const gasUsed = web3.utils.toBN(receipt.receipt.gasUsed);
  const tx = await web3.eth.getTransaction(receipt.tx);
  const balanceAfterUser2BuysStar = new BN(await web3.eth.getBalance(user2));

  let value = balanceOfUser2BeforeTransaction
    .sub(balanceAfterUser2BuysStar)
    .sub(gasPrice.mul(gasUsed));
  assert.equal(value, starPrice);
});
