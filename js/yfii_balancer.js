$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const YGOV_BPT_POOL = new ethers.Contract(YFII_BPT_STAKING_POOL_ADDR, YGOV_BPT_STAKING_POOL_ABI, App.provider);
    const YFI_DAI_BALANCER_POOL = new ethers.Contract(YFII_DAI_BPT_TOKEN_ADDR, BALANCER_POOL_ABI, App.provider);
    const YFI_DAI_BPT_TOKEN_CONTRACT = new ethers.Contract(YFII_DAI_BPT_TOKEN_ADDR, ERC20_ABI, App.provider);

    const stakedBPTAmount = await YGOV_BPT_POOL.balanceOf(App.YOUR_ADDRESS) / 1e18;
    const earnedYFI = await YGOV_BPT_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalBPTAmount = await YFI_DAI_BALANCER_POOL.totalSupply() / 1e18;
    const totalStakedBPTAmount = await YFI_DAI_BPT_TOKEN_CONTRACT.balanceOf(YFII_BPT_STAKING_POOL_ADDR) / 1e18;
    const totalYFIAmount = await YFI_DAI_BALANCER_POOL.getBalance(YFII_TOKEN_ADDR) / 1e18;
    const totalDAIAmount = await YFI_DAI_BALANCER_POOL.getBalance(DAI_TOKEN_ADDR) / 1e18;

    const YFIPerBPT = totalYFIAmount / totalBPTAmount;
    const DAIPerBPT = totalDAIAmount / totalBPTAmount;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(YGOV_BPT_POOL);
    const nextHalving = await getPeriodFinishForReward(YGOV_BPT_POOL);

    const rewardPerToken = weekly_reward / totalStakedBPTAmount;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // Look up prices
    const prices = await lookUpPrices(["dai"]);
    const DAIPrice = prices["dai"].usd;
    const YFIIPrice = (await YFI_DAI_BALANCER_POOL.getSpotPrice(DAI_TOKEN_ADDR,YFII_TOKEN_ADDR) / 1e18) * DAIPrice;

    const BPTPrice = YFIPerBPT * YFIIPrice + DAIPerBPT * DAIPrice;

    // Finished. Start printing

    _print("========== 价格比 ==========")
    _print(`1 YFII   = $${YFIIPrice}`);
    _print(`1 DAI    = $${DAIPrice}\n`);
    _print(`1 BPT    = [${YFIPerBPT} YFII, ${DAIPerBPT} DAI]`);
    _print(`         = ${toDollar(YFIPerBPT * YFIIPrice + DAIPerBPT * DAIPrice)}\n`);

    _print("========== 质押 =========")
    _print(`总共有  : ${totalBPTAmount} BPT issued by YFII DAI Balancer Pool.`);
    _print(`总共有  : ${totalStakedBPTAmount} BPT staked in YFII's BPT staking pool.`);
    _print(`          = ${toDollar(totalStakedBPTAmount * BPTPrice)}\n`);
    _print(`你在质押: ${stakedBPTAmount} BPT (${toFixed(stakedBPTAmount * 100 / totalStakedBPTAmount, 3)}% of the pool)`);
    _print(`          = [${YFIPerBPT * stakedBPTAmount} YFII, ${DAIPerBPT * stakedBPTAmount} DAI]`);
    _print(`          = ${toDollar(YFIPerBPT * stakedBPTAmount * YFIIPrice + DAIPerBPT * stakedBPTAmount * DAIPrice)}\n`);

    // YFII REWARDS
    _print("======== YFII 奖励 ========")
    // _print(" (Temporarily paused until further emission model is voted by the community) ");
    _print(`领取奖励: ${toFixed(earnedYFI, 4)} YFII = ${toDollar(earnedYFI * YFIIPrice)}`);
    _print(`每周估算: ${toFixed(rewardPerToken * stakedBPTAmount, 2)} YFII = ${toDollar(rewardPerToken * stakedBPTAmount * YFIIPrice)} (out of total ${weekly_reward} YFII)`)
    const YFIWeeklyROI = (rewardPerToken * YFIIPrice) * 100 / (BPTPrice);
    _print(`每周投资回报率（美元）: ${toFixed(YFIWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定)       : ${toFixed(YFIWeeklyROI * 52, 4)}% \n`)

    const timeTilHalving = nextHalving - (Date.now() / 1000);

    _print(`下半部 : in ${forHumans(timeTilHalving)} \n`)

    // BAL REWARDS
    _print("======= BAL 奖励 ? =======")
    _print(`    尚未列入白名单？`);
    _print(`    Check http://www.predictions.exchange/balancer/ for latest update \n`)

    hideLoading();

}