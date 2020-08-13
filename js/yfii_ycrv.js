$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const Y_STAKING_POOL = new ethers.Contract(YFII_STAKING_POOL_ADDR, Y_STAKING_POOL_ABI, App.provider);
    const CURVE_Y_POOL = new ethers.Contract(CURVE_Y_POOL_ADDR, CURVE_Y_POOL_ABI, App.provider);
    const Y_TOKEN = new ethers.Contract(Y_TOKEN_ADDR, ERC20_ABI, App.provider);
    const YFI_DAI_BALANCER_POOL = new ethers.Contract(YFII_DAI_BPT_TOKEN_ADDR, BALANCER_POOL_ABI, App.provider);


    const stakedYAmount = await Y_STAKING_POOL.balanceOf(App.YOUR_ADDRESS) / 1e18;
    const earnedYFI = await Y_STAKING_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalSupplyY = await Y_TOKEN.totalSupply() / 1e18;
    const totalStakedYAmount = await Y_TOKEN.balanceOf(YFII_STAKING_POOL_ADDR) / 1e18;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(Y_STAKING_POOL);
    const nextHalving = await getPeriodFinishForReward(Y_STAKING_POOL);

    // const weekly_reward = 0;

    const rewardPerToken = weekly_reward / totalStakedYAmount;

    // Find out underlying assets of Y
    const YVirtualPrice = await CURVE_Y_POOL.get_virtual_price() / 1e18;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // Look up prices
    // const prices = await lookUpPrices(["yearn-finance"]);
    // const YFIPrice = prices["yearn-finance"].usd;
    const prices = await lookUpPrices(["dai"]);
    const DAIPrice = prices["dai"].usd;
    const YFIIPrice = (await YFI_DAI_BALANCER_POOL.getSpotPrice(DAI_TOKEN_ADDR,YFII_TOKEN_ADDR) / 1e18) * DAIPrice;


    // Finished. Start printing

    _print("========== 价格比 ==========")
    _print(`1 YFII   = $${YFIIPrice}`);
    _print(`1 yCRV   = $${YVirtualPrice}\n`);

    _print("========== 质押 =========")
    _print(`总共有  : ${totalSupplyY} yCRV issued by Y Curve Pool.`);
    _print(`总共有  : ${totalStakedYAmount} yCRV staked in YFII's yCRV staking pool.`);
    _print(`          = ${toDollar(totalStakedYAmount * YVirtualPrice)}\n`);
    _print(`你在质押: ${stakedYAmount} yCRV (${toFixed(stakedYAmount * 100 / totalStakedYAmount, 3)}% of the pool)`);
    _print(`          = ${toDollar(stakedYAmount * YVirtualPrice)}\n`);

    // YFII REWARDS
    _print("======== YFII 奖励 ========")
    // _print(" (Temporarily paused until further emission model is voted by the community) ");
    _print(`领取奖励: ${toFixed(earnedYFI, 4)} YFII = $${toFixed(earnedYFI * YFIIPrice, 2)}`);
    _print(`每周估算: ${toFixed(rewardPerToken * stakedYAmount, 2)} YFII = ${toDollar(rewardPerToken * stakedYAmount * YFIIPrice)} (out of total ${weekly_reward} YFII)`)
    const YFIWeeklyROI = (rewardPerToken * YFIIPrice) * 100 / (YVirtualPrice);
    _print(`每周投资回报率（美元） : ${toFixed(YFIWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定)        : ${toFixed(YFIWeeklyROI * 52, 4)}% \n`)

    const timeTilHalving = nextHalving - (Date.now() / 1000);
    _print(`下半部      : in ${forHumans(timeTilHalving)} \n`)

    // CRV REWARDS
    _print("======== CRV 奖励 ========")
    _print(`    尚未分发`);

    hideLoading();

}