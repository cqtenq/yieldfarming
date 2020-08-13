$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const CURVE_SUSD_POOL = new ethers.Contract(CURVE_SUSD_POOL_ADDR, CURVE_SUSD_POOL_ABI, App.provider);
    const SYNTH_crvPlain3andSUSD_POOL = new ethers.Contract(SYNTH_crvPlain3andSUSD_STAKING_POOL_ADDR, SYNTH_crvPlain3andSUSD_STAKING_POOL_ABI, App.provider);
    const crvPlain3andSUSD_TOKEN_CONTRACT = new ethers.Contract(crvPlain3andSUSD_TOKEN_ADDR, ERC20_ABI, App.provider);

    // SYNTH Staking pool
    const rawStakedCRVAmount = await SYNTH_crvPlain3andSUSD_POOL.balanceOf(App.YOUR_ADDRESS);
    const stakedCRVAmount = rawStakedCRVAmount / 1e18;
    const earnedSNX = await SYNTH_crvPlain3andSUSD_POOL.earned(App.YOUR_ADDRESS) / 1e18;

    // Curve susd pool
    const totalCrvPlain3andSUSDSupply = await crvPlain3andSUSD_TOKEN_CONTRACT.totalSupply() / 1e18;
    const totalStakedCrvPlain3andSUSDAmount = await crvPlain3andSUSD_TOKEN_CONTRACT.balanceOf(SYNTH_crvPlain3andSUSD_STAKING_POOL_ADDR) / 1e18;
    const stakingPoolPercentage = 100 * stakedCRVAmount / totalStakedCrvPlain3andSUSDAmount;

    const totalDaiAmount = await CURVE_SUSD_POOL.balances(0) / 1e18;
    const totalUSDCAmount = await CURVE_SUSD_POOL.balances(1) / 1e6;
    const totalUSDTAmount = await CURVE_SUSD_POOL.balances(2) / 1e6;
    const totalSUSDAmount = await CURVE_SUSD_POOL.balances(3) / 1e18;

    const DAIPerToken = totalDaiAmount / totalCrvPlain3andSUSDSupply;
    const USDCPerToken = totalUSDCAmount  / totalCrvPlain3andSUSDSupply;
    const USDTPerToken = totalUSDTAmount / totalCrvPlain3andSUSDSupply;
    const sUSDPerToken = totalSUSDAmount / totalCrvPlain3andSUSDSupply;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(SYNTH_crvPlain3andSUSD_POOL);
    const rewardPerToken = weekly_reward / totalStakedCrvPlain3andSUSDAmount;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // CoinGecko price lookup
    const prices = await lookUpPrices(["havven", "dai", "usd-coin", "tether", "nusd"]);

    const SNXPrice = prices.havven.usd;
    const DAIPrice = prices.dai.usd;
    const USDCPrice = prices["usd-coin"].usd;
    const USDTPrice = prices.tether.usd
    const sUSDPrice = prices.nusd.usd;

    const crvPlain3andSUSDPricePerToken = toFixed(
        DAIPerToken * DAIPrice +
        USDCPerToken * USDCPrice +
        USDTPerToken * USDTPrice +
        sUSDPerToken * sUSDPrice, 2);

    _print("========== 价格比 ==========")
    _print(`1 SNX   = $${SNXPrice}\n`);

    _print(`1 DAI   = $${DAIPrice}`);
    _print(`1 USDC  = $${USDCPrice}`);
    _print(`1 USDT  = $${USDTPrice}`);
    _print(`1 sUSD  = $${sUSDPrice}\n`);

    _print("========= 质押 ==========")
    _print(`总共有  : ${totalCrvPlain3andSUSDSupply} crvPlain3andSUSD given out by Curve.`);
    _print(`总共有  : ${totalStakedCrvPlain3andSUSDAmount} crvPlain3andSUSD staked in Synthetix's pool.`);
    _print(`          = ${toDollar(totalStakedCrvPlain3andSUSDAmount * crvPlain3andSUSDPricePerToken)} \n`);
    _print(`你在质押: ${stakedCRVAmount} crvPlain3andSUSD (${toFixed(stakingPoolPercentage, 5)}% of the pool)`);
    _print(`          ≈ ${toDollar(crvPlain3andSUSDPricePerToken * stakedCRVAmount)} (Averaged)\n`);

    _print("======== SNX 奖励 =======")
    _print(`领取奖励: ${earnedSNX} SNX`);
    _print(`           = ${toDollar(earnedSNX * SNXPrice)}\n`)

    _print(`每周估算: ${rewardPerToken * stakedCRVAmount} SNX (out of total ${weekly_reward} SNX)`)
    _print(`          = ${toDollar((rewardPerToken * stakedCRVAmount) * SNXPrice)}`)
    const SNXWeeklyROI = rewardPerToken * SNXPrice * 100 / crvPlain3andSUSDPricePerToken;
    _print(`每周投资回报率（美元）: ${toFixed(SNXWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定)       : ${toFixed(SNXWeeklyROI * 52, 4)}% \n`)

    _print("======== CRV 奖励 ========")
    _print(`    尚未分发`);
    hideLoading();

}