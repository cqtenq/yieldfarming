$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const SYNTH_BPT_POOL = new ethers.Contract(SYNTH_USDC_SNX_BPT_STAKING_POOL_ADDR, SYNTH_USDC_SNX_BPT_STAKING_POOL_ABI, App.provider);
    const SNX_USDC_BALANCER_POOL = new ethers.Contract(BALANCER_USDC_SNX_POOL_ADDRESS, BALANCER_POOL_ABI, App.provider);
    const SNX_USDC_BPT_TOKEN_CONTRACT = new ethers.Contract(SNX_USDC_BPT_ADDRESS, ERC20_ABI, App.provider);

    const stakedBPTAmount = await SYNTH_BPT_POOL.balanceOf(App.YOUR_ADDRESS) / 1e18;
    const earnedSNX = await SYNTH_BPT_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalBPTAmount = await SNX_USDC_BALANCER_POOL.totalSupply() / 1e18;
    const totalStakedBPTAmount = await SNX_USDC_BPT_TOKEN_CONTRACT.balanceOf(SYNTH_USDC_SNX_BPT_STAKING_POOL_ADDR) / 1e18;
    const totalSNXAmount = await SNX_USDC_BALANCER_POOL.getBalance(SNX_TOKEN_ADDRESS) / 1e18;
    const totalUSDCAmount = await SNX_USDC_BALANCER_POOL.getBalance(USDC_ADDRESS) / 1e6;

    const SNXperBPT = totalSNXAmount / totalBPTAmount;
    const USDCperBPT = totalUSDCAmount / totalBPTAmount;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(SYNTH_BPT_POOL);
    const rewardPerToken = weekly_reward / totalStakedBPTAmount;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // Look up prices
    const prices = await lookUpPrices(["havven", "usd-coin", "balancer"]);
    const SNXPrice = prices.havven.usd;
    const USDCPrice = prices["usd-coin"].usd;
    const BALPrice = prices.balancer.usd;

    const BPTPrice = SNXperBPT * SNXPrice + USDCperBPT * USDCPrice;

    // Finished. Start printing

    _print("========== 价格比 ==========")
    _print(`1 SNX   = $${SNXPrice}`);
    _print(`1 USDC  = $${USDCPrice}\n`);
    _print(`1 BPT   = [${SNXperBPT} SNX, ${USDCperBPT} USDC]`);
    _print(`        = $${SNXperBPT * SNXPrice + USDCperBPT * USDCPrice}\n`);
    _print(`1 BAL   = $${BALPrice}\n`)

    _print("========== 质押 =========")
    _print(`总共有  : ${totalBPTAmount} BPT in the Balancer Contract.`);
    _print(`总共有  : ${totalStakedBPTAmount} BPT staked in Synthetix's pool. \n`);
    _print(`你在质押: ${stakedBPTAmount} BPT (${toFixed(stakedBPTAmount * 100 / totalStakedBPTAmount, 3)}% of the pool)`);
    _print(`          = [${SNXperBPT * stakedBPTAmount} SNX, ${USDCperBPT * stakedBPTAmount} USDC]`);
    _print(`          = $${toFixed(SNXperBPT * stakedBPTAmount * SNXPrice + USDCperBPT * stakedBPTAmount * USDCPrice, 2)}\n`);

    // SNX REWARDS
    _print("======== SNX 奖励 ========")
    _print(`领取奖励: ${toFixed(earnedSNX, 2)} SNX = $${toFixed(earnedSNX * SNXPrice, 2)}`);
    _print(`每周估算: ${toFixed(rewardPerToken * stakedBPTAmount, 2)} SNX = $${toFixed(rewardPerToken * stakedBPTAmount * SNXPrice, 2)} (out of total ${weekly_reward} SNX)`)
    const SNXWeeklyROI = (rewardPerToken * SNXPrice) * 100 / (BPTPrice);
    _print(`每周投资回报率（美元）: ${toFixed(SNXWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定)       : ${toFixed(SNXWeeklyROI * 52, 4)}% \n`)

    // BAL REWARDS
    _print("======== BAL 奖励 ========")
    _print("WARNING: 这一估计是基于上周的回报和当前的资金池流动性。")
    _print("       : **这将比你在本周末得到的要高得多。** \n")

    const totalBALAmount = await getLatestTotalBALAmount(SYNTH_USDC_SNX_BPT_STAKING_POOL_ADDR);
    const BALPerToken = totalBALAmount * (1 / totalBPTAmount);
    const yourBALEarnings = BALPerToken * stakedBPTAmount;

    _print(`每周估算: ${toFixed(yourBALEarnings, 4)} BAL = $${toFixed(yourBALEarnings * BALPrice, 2)} (out of total ${toFixed(totalBALAmount, 4)} BAL)`);
    const BALWeeklyROI = (BALPerToken * BALPrice) * 100 / BPTPrice;
    _print(`每周投资回报率（美元）: ${toFixed(BALWeeklyROI, 4)}%`);
    _print(`年利率 (不稳定)       : ${toFixed(BALWeeklyROI * 52, 4)}% \n`)

    hideLoading();

}