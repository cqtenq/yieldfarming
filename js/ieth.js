$(function() {
    consoleInit();
    start(main);
});

async function main() {
    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const SYNTH_iETH_POOL = new ethers.Contract(SYNTH_iETH_STAKING_POOL_ADDR, SYNTH_iETH_STAKING_POOL_ABI, App.provider);
    const iETH_CONTRACT = new ethers.Contract(iETH_TOKEN_ADDR, ERC20_ABI, App.provider);

    const yourStakedIETHAmount = await SYNTH_iETH_POOL.balanceOf(App.YOUR_ADDRESS) / 1e18;
    const earnedSNX = await SYNTH_iETH_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalIETHAmount = await iETH_CONTRACT.totalSupply() / 1e18;
    const totalStakedIETHAmount = await iETH_CONTRACT.balanceOf(SYNTH_iETH_STAKING_POOL_ADDR) / 1e18;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(SYNTH_iETH_POOL);
    const rewardPerToken = weekly_reward / totalStakedIETHAmount;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // Look up prices
    const prices = await lookUpPrices(["havven", "ieth"]);
    const SNXprice = prices.havven.usd;
    const iETHprice = prices.ieth.usd;

    // Finished. Start printing

    _print("========== 价格比 ==========")
    _print(`1 SNX   = ${toDollar(SNXprice)}`);
    _print(`1 iETH  = ${toDollar(iETHprice)}\n`);

    _print("===== 质押 & 奖励 ====")
    _print(`总共有  : ${totalIETHAmount} iETH given out by Synthetix.`);
    _print(`总共有  : ${totalStakedIETHAmount} iETH staked in Synthetix's pool. `);
    _print(`          = ${toDollar(totalStakedIETHAmount * iETHprice)}\n`);
    _print(`你在质押: ${yourStakedIETHAmount} iETH (${toFixed(yourStakedIETHAmount * 100 / totalStakedIETHAmount, 3)}% of the pool)`);
    _print(`          = ${toDollar(yourStakedIETHAmount * iETHprice)}\n`);

    _print(`领取奖励: ${toFixed(earnedSNX, 2)} SNX = $${toFixed(earnedSNX * SNXprice, 2)}`);
    _print(`每周估算: ${toFixed(rewardPerToken * yourStakedIETHAmount, 2)} SNX = ${toDollar(rewardPerToken * yourStakedIETHAmount * SNXprice)} (out of total ${weekly_reward} SNX)`)
    const SNXWeeklyROI = (rewardPerToken * SNXprice) * 100 / iETHprice;
    _print(`每周投资回报率 : ${toFixed(SNXWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定): ${toFixed(SNXWeeklyROI * 52, 4)}%`)

    hideLoading();

}