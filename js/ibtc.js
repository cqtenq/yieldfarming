$(function() {
    consoleInit();
    start(main);
});

async function main() {
    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const SYNTH_iBTC_POOL = new ethers.Contract(SYNTH_iBTC_STAKING_POOL_ADDR, SYNTH_iBTC_STAKING_POOL_ABI, App.provider);
    const iBTC_CONTRACT = new ethers.Contract(iBTC_TOKEN_ADDR, ERC20_ABI, App.provider);

    const yourStakedIBTCAmount = await SYNTH_iBTC_POOL.balanceOf(App.YOUR_ADDRESS) / 1e18;
    const earnedSNX = await SYNTH_iBTC_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalIBTCAmount = await iBTC_CONTRACT.totalSupply() / 1e18;
    const totalStakedIBTCAmount = await iBTC_CONTRACT.balanceOf(SYNTH_iBTC_STAKING_POOL_ADDR) / 1e18;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(SYNTH_iBTC_POOL);
    const rewardPerToken = weekly_reward / totalStakedIBTCAmount;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // Look up prices
    const prices = await lookUpPrices(["havven", "ibtc"]);
    const SNXPrice = prices.havven.usd;
    const iBTCPrice = prices.ibtc.usd;

    // Finished. Start printing

    _print("========== 价格比 ==========")
    _print(`1 SNX = ${toDollar(SNXPrice)}`);
    _print(`1 iBTC = ${toDollar(iBTCPrice)}\n`);

    _print("===== 质押 & 奖励 ====")
    _print(`总共有  : ${totalIBTCAmount} iBTC given out by Synthetix.`);
    _print(`总共有  : ${totalStakedIBTCAmount} iBTC staked in Synthetix's pool. `);
    _print(`          = ${toDollar(totalStakedIBTCAmount * iBTCPrice)}\n`);
    _print(`你在质押: ${yourStakedIBTCAmount} iBTC (${toFixed(yourStakedIBTCAmount * 100 / totalStakedIBTCAmount, 3)}% of the pool)`);
    _print(`          = ${toDollar(yourStakedIBTCAmount * iBTCPrice)}\n`);

    _print(`领取奖励: ${toFixed(earnedSNX, 2)} SNX = $${toFixed(earnedSNX * SNXPrice, 2)}`);
    _print(`每周估算: ${toFixed(rewardPerToken * yourStakedIBTCAmount, 2)} SNX = ${toDollar(rewardPerToken * yourStakedIBTCAmount * SNXPrice)} (out of total ${weekly_reward} SNX)`)
    const SNXWeeklyROI = (rewardPerToken * SNXPrice) * 100 / iBTCPrice;
    _print(`每周投资回报率 : ${toFixed(SNXWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定): ${toFixed(SNXWeeklyROI * 52, 4)}%`)

    hideLoading();
}