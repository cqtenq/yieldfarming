$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const CURVE_BTC_POOL = new ethers.Contract(CURVE_BTC_POOL_ADDR, CURVE_BTC_POOL_ABI, App.provider);
    const SYNTH_CRV_POOL = new ethers.Contract(SYNTH_crvRenWSBTC_STAKING_POOL_ADDR, SYNTH_crvRenWSBTC_STAKING_POOL_ABI, App.provider);
    const BALANCER_SNX_REN_POOL = new ethers.Contract(BALANCER_SNX_REN_POOL_ADDR, BALANCER_SNX_REN_POOL_ABI, App.provider);
    const BPT_POOL = new ethers.Contract(BPT_SNX_REN_TOKEN_ADDR, ERC20_ABI, App.provider);
    const crvRenWSBTC_TOKEN_CONTRACT = new ethers.Contract(crvRenWSBTC_TOKEN_ADDR, ERC20_ABI, App.provider);

    // Curve
    const rawStakedCRVAmount = await SYNTH_CRV_POOL.balanceOf(App.YOUR_ADDRESS);
    const stakedCRVAmount = rawStakedCRVAmount / 1e18;

    const totalRenBTCAmount = await CURVE_BTC_POOL.balances(0) / 1e8;
    const totalWBTCAmount = await CURVE_BTC_POOL.balances(1) / 1e8;
    const totalSBTCAmount = await CURVE_BTC_POOL.balances(2) / 1e18;
    const totalCrvRenWSBTCSupply = await crvRenWSBTC_TOKEN_CONTRACT.totalSupply() / 1e18;

    const renBTCamountPerToken = totalRenBTCAmount * (1 / totalCrvRenWSBTCSupply);
    const wBTCamountPerToken = totalWBTCAmount * (1 / totalCrvRenWSBTCSupply);
    const sBTCamountPerToken = totalSBTCAmount * (1 / totalCrvRenWSBTCSupply);

    // Balancer
    const earnedBPT = await SYNTH_CRV_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalBPTAmount = await BALANCER_SNX_REN_POOL.totalSupply() / 1e18;
    const totalSNXAmount = await BALANCER_SNX_REN_POOL.getBalance(SNX_TOKEN_ADDRESS) / 1e18;
    const totalBPTInSynthContract = await BPT_POOL.balanceOf(SYNTH_crvRenWSBTC_STAKING_POOL_ADDR) / 1e18;

    const totalStakedCrvRenWSBTCAmount = await crvRenWSBTC_TOKEN_CONTRACT.balanceOf(SYNTH_crvRenWSBTC_STAKING_POOL_ADDR) / 1e18;
    const totalRENAmount = await BALANCER_SNX_REN_POOL.getBalance(REN_ADDRESS) / 1e18;

    const SNXperBPT = totalSNXAmount / totalBPTAmount;
    const RENperBPT = totalRENAmount / totalBPTAmount;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(SYNTH_CRV_POOL);
    const rewardPerToken = weekly_reward / totalStakedCrvRenWSBTCAmount;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // CoinGecko price lookup
    const prices = await lookUpPrices(["havven", "republic-protocol", "wrapped-bitcoin", "sbtc", "renbtc", "balancer"]);

    const SNXprice = prices.havven.usd;
    const RENprice = prices["republic-protocol"].usd;
    const BPTPrice = SNXperBPT * SNXprice + RENperBPT * RENprice;

    const renBTCPrice = prices.renbtc.usd;
    const wBTCPrice = prices["wrapped-bitcoin"].usd;
    const SBTCPrice = prices.sbtc.usd;
    const crvRenWSBTCPricePerToken = toFixed(renBTCamountPerToken * renBTCPrice + wBTCamountPerToken * wBTCPrice + sBTCamountPerToken * SBTCPrice, 2);

    const BALPrice = prices.balancer.usd;

    _print("========== 价格比 ==========")
    _print(`1 SNX    = $${SNXprice}`);
    _print(`1 REN    = $${RENprice}\n`);
    _print(`1 BPT (79.82% SNX, 20.17% REN) = [${SNXperBPT} SNX, ${RENperBPT} REN]`);
    _print(`         = $${BPTPrice}\n`);

    _print(`1 renBTC = $${renBTCPrice}`);
    _print(`1 wBTC   = $${wBTCPrice}`);
    _print(`1 sBTC   = $${SBTCPrice}\n`);

    _print("========= 质押 ==========")
    _print(`总共有  : ${totalCrvRenWSBTCSupply} crvRenWSBTC given out by Curve.`);
    _print(`总共有  : ${totalStakedCrvRenWSBTCAmount} crvRenWSBTC staked in Synthetix's pool.`);
    _print(`          = ${toDollar(totalStakedCrvRenWSBTCAmount * crvRenWSBTCPricePerToken)}\n`);
    _print(`你在质押: ${stakedCRVAmount} crvRenWSBTC (${toFixed(100 * stakedCRVAmount / totalStakedCrvRenWSBTCAmount, 3)}% of the pool)`);
    _print(`          ≈ ${toDollar(crvRenWSBTCPricePerToken * stakedCRVAmount)} (Averaged)\n`);

    _print("====== SNX/REN 奖励 =====")
    _print(`领取奖励: ${earnedBPT} BPT`);
    _print(`          = [${earnedBPT * SNXperBPT} SNX + ${earnedBPT * RENperBPT} REN]`);
    _print(`          = ${toDollar(earnedBPT * BPTPrice)}\n`)

    _print(`每周估算: ${rewardPerToken * stakedCRVAmount} BPT (out of total ${weekly_reward} BPT)`)
    _print(`          = ${toDollar((rewardPerToken * stakedCRVAmount) * BPTPrice)}`)
    const SNXWeeklyROI = rewardPerToken * BPTPrice * 100 / crvRenWSBTCPricePerToken;
    _print(`每周投资回报率 : ${toFixed(SNXWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定): ${toFixed(SNXWeeklyROI * 52, 4)}%\n`)

    // BAL REWARDS
    _print("======== BAL 奖励 ========")
    _print("警告：这一估计是基于上周的奖励和当前的资金池流动性。")
    _print("     : **这将比你在本周末得到的要高得多。** \n")

    const totalBALAmount = await getLatestTotalBALAmount(SYNTH_crvRenWSBTC_STAKING_POOL_ADDR);
    const BALPerToken = totalBALAmount * (1 / totalBPTInSynthContract);
    const yourBALEarnings = BALPerToken * rewardPerToken * stakedCRVAmount;
    const crvRenWSBTCPerDollar = (1 / crvRenWSBTCPricePerToken);

    _print(`每周估算   : ${toFixed(yourBALEarnings, 4)} BAL = ${toDollar(yourBALEarnings * BALPrice)} (out of total ${toFixed(totalBALAmount, 4)} BAL)`);
    const BALWeeklyROI = (BALPerToken * BALPrice) * 100 * (rewardPerToken * crvRenWSBTCPerDollar);
    _print(`每周投资回报率（美元）: ${toFixed(BALWeeklyROI, 4)}%`);
    _print(`年利率 (不稳定)       : ${toFixed(BALWeeklyROI * 52, 4)}%\n`);

    // CRV REWARDS
    _print("======== CRV 奖励 ========")
    _print(`    尚未分发`);

    hideLoading();

}