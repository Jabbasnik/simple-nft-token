const StarNotary = artifacts.require("StarNotary");

let accounts;
let owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

beforeEach(async function () {
    instance = await StarNotary.deployed();
});

it('can Create a Star', async () => {
    let tokenId = 1;
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async () => {
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async () => {
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.approve(user2, starId, {from: user1, gasPrice: 0});
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice: 0});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async () => {
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    await instance.approve(user2, starId, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async () => {
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.approve(user2, starId, {from: user1});
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice: 0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

it('can add the star name and star symbol properly', async () => {
    let [actualName, actualSymbol] = await Promise.all([
        instance.name.call(),
        instance.symbol.call()]);
    assert.equal(actualName, 'MJStar');
    assert.equal(actualSymbol, 'MJS');
});

it('lets 2 users exchange stars', async () => {
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId1 = 7;
    let starId2 = 8;
    await Promise.all([
        instance.createStar('MJ', starId1, {from: user1}),
        instance.createStar('MJJStar', starId2, {from: user2}),
        instance.exchangeStars(starId1, starId2, {from: user1})
    ]);
    assert.equal(await instance.ownerOf.call(starId1), user2);
    assert.equal(await instance.ownerOf.call(starId2), user1);
});

it('lets a user transfer a star', async () => {
    let user = accounts[1];
    let to_user = accounts[2];
    let starId = 9;
    await Promise.all([
        instance.createStar('MJ', starId, {from: user}),
        instance.transferStar(to_user, starId, {from: user})]);
    assert.equal(await instance.ownerOf.call(starId), to_user);
});

it('lookUptokenIdToStarInfo test', async () => {
    let user = accounts[1];
    let starId = 10;
    await instance.createStar('MJ1', starId, {from: user});
    let name = await instance.lookUptokenIdToStarInfo(starId, {from: user});
    assert.equal(name, 'MJ1');
});