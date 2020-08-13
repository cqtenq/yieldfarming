$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const YGOV_2_BPT_POOL = new ethers.Contract(YGOV_BPT_2_STAKING_POOL_ADDR, YGOV_BPT_2_STAKING_POOL_ABI, App.provider);
    const Y_DAI_BALANCER_POOL = new ethers.Contract(YFI_YCRV_BPT_TOKEN_ADDR, BALANCER_POOL_ABI, App.provider);
    const Y_DAI_BPT_TOKEN_CONTRACT = new ethers.Contract(YFI_YCRV_BPT_TOKEN_ADDR, ERC20_ABI, App.provider);
    const CURVE_Y_POOL = new ethers.Contract(CURVE_Y_POOL_ADDR, CURVE_Y_POOL_ABI, App.provider);
    const YFI_TOKEN_CONTRACT = new ethers.Contract(YFI_TOKEN_ADDR, ERC20_ABI, App.provider);

    const stakedBPTAmount = await YGOV_2_BPT_POOL.balanceOf(App.YOUR_ADDRESS) / 1e18;
    const earnedYFI = await YGOV_2_BPT_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalBPTAmount = await Y_DAI_BALANCER_POOL.totalSupply() / 1e18;
    const totalStakedBPTAmount = await Y_DAI_BPT_TOKEN_CONTRACT.balanceOf(YGOV_BPT_2_STAKING_POOL_ADDR) / 1e18;
    const totalYFIAmount = await Y_DAI_BALANCER_POOL.getBalance(YFI_TOKEN_ADDR) / 1e18;
    const totalYAmount = await Y_DAI_BALANCER_POOL.getBalance(Y_TOKEN_ADDR) / 1e18;

    const YFIPerBPT = totalYFIAmount / totalBPTAmount;
    const YPerBPT = totalYAmount / totalBPTAmount;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(YGOV_2_BPT_POOL);
    const rewardPerToken = weekly_reward / totalStakedBPTAmount;

    // Find out underlying assets of Y
    const YVirtualPrice = await CURVE_Y_POOL.get_virtual_price() / 1e18;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // Look up prices
    const prices = await lookUpPrices(["yearn-finance"]);
    const YFIPrice = prices["yearn-finance"].usd;

    const BPTPrice = YFIPerBPT * YFIPrice + YPerBPT * YVirtualPrice;

    // Finished. Start printing

    _print("========== 价格比 ==========")
    _print(`1 YFI   = $${YFIPrice}`);
    _print(`1 yCRV  = $${YVirtualPrice}`);
    _print(`1 BPT   = [${YFIPerBPT} YFI, ${YPerBPT} yCRV]`);
    _print(`        = $${YFIPerBPT * YFIPrice + YPerBPT * YVirtualPrice}\n`);

    _print("========== 质押 =========")
    _print(`总共有  : ${totalBPTAmount} BPT issued by YFI-yCRV Balancer Pool.`);
    _print(`总共有  : ${totalStakedBPTAmount} BPT staked in Ygov's BPT staking pool. `);
    _print(`          = $${toFixed(totalStakedBPTAmount * BPTPrice, 2)}\n`);
    _print(`你在质押: ${stakedBPTAmount} BPT (${toFixed(stakedBPTAmount * 100 / totalStakedBPTAmount, 3)}% of the pool)`);
    _print(`          = [${YFIPerBPT * stakedBPTAmount} YFI, ${YPerBPT * stakedBPTAmount} yCRV]`);
    _print(`          = $${toFixed(YFIPerBPT * stakedBPTAmount * YFIPrice + YPerBPT * stakedBPTAmount * YVirtualPrice, 2)}\n`);

    // YFI REWARDS
    _print("======== YFI 奖励 ========")
    _print(`领取奖励: ${toFixed(earnedYFI, 4)} YFI = $${toFixed(earnedYFI * YFIPrice, 2)}`);
    _print(`每周估算: ${toFixed(rewardPerToken * stakedBPTAmount, 2)} YFI = $${toFixed(rewardPerToken * stakedBPTAmount * YFIPrice, 2)} (out of total ${weekly_reward} YFI)`)
    const YFIWeeklyROI = (rewardPerToken * YFIPrice) * 100 / (BPTPrice);
    _print(`每周投资回报率（美元）: ${toFixed(YFIWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定)       : ${toFixed(YFIWeeklyROI * 52, 4)}% \n`)

    // BAL REWARDS
    _print("======= BAL 奖励 ? =======")
    _print(`    尚未列入白名单？`);
    _print(`    Check http://www.predictions.exchange/balancer/ for latest update \n`)

    // CRV REWARDS
    _print("======== CRV 奖励 ========")
    _print(`    尚未分发\n`);

    hideLoading();

}