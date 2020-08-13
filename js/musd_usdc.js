$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const MUSD_USDC_BALANCER_POOL = new ethers.Contract(MUSD_USDC_BPT_TOKEN_ADDR, BALANCER_POOL_ABI, App.provider);
    const MUSD_USDC_BPT_TOKEN_CONTRACT = new ethers.Contract(MUSD_USDC_BPT_TOKEN_ADDR, ERC20_ABI, App.provider);
    const BPT_STAKING_POOL = new ethers.Contract(MUSD_USDC_BPT_TOKEN_STAKING_ADDR, MSTABLE_REWARDS_POOL_ABI, App.provider);

    const totalBPTAmount = await MUSD_USDC_BALANCER_POOL.totalSupply() / 1e18;
    const totalStakedBPTAmount = await MUSD_USDC_BPT_TOKEN_CONTRACT.balanceOf(MUSD_USDC_BPT_TOKEN_STAKING_ADDR) / 1e18;
    const yourBPTAmount = await BPT_STAKING_POOL.balanceOf(App.YOUR_ADDRESS) / 1e18;

    const totalUSDCAmount = await MUSD_USDC_BALANCER_POOL.getBalance(USDC_ADDRESS) / 1e6;
    const totalMUSDAmount = await MUSD_USDC_BALANCER_POOL.getBalance(MUSD_TOKEN_ADDR) / 1e18;

    const USDCPerBPT = totalUSDCAmount / totalBPTAmount;
    const MUSDPerBPT = totalMUSDAmount / totalBPTAmount;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(BPT_STAKING_POOL);
    const MTARewardPerBPT = weekly_reward / totalStakedBPTAmount;

    _print("已阅读完智能合约... 正在查找价格... \n")

    // Look up prices
    const prices = await lookUpPrices(["musd", "meta", "usd-coin"]);
    const MTAPrice = prices["meta"].usd;
    const MUSDPrice = prices["musd"].usd;
    const USDCPrice = prices["usd-coin"].usd;

    const BPTPrice = USDCPerBPT * USDCPrice + MUSDPerBPT * MUSDPrice;

    // Finished. Start printing

    _print("========== PRICES ==========")
    _print(`1 MTA   = $${MTAPrice}`);
    _print(`1 MUSD  = $${MUSDPrice}`);
    _print(`1 USDC  = $${USDCPrice}\n`);
    _print(`1 BPT   = [${MUSDPerBPT} MUSD, ${USDCPerBPT} USDC]`);
    _print(`        = ${toDollar(BPTPrice)}\n`);

    _print("========== 价格比 =========")
    _print(`总共有  : ${totalBPTAmount} BPT issued by mUSD-USDC Balancer Pool.`);
    _print(`          = ${toDollar(totalBPTAmount * BPTPrice)}`);
    _print(`总共有  : ${totalStakedBPTAmount} BPT staked.`);
    _print(`          = ${toDollar(totalStakedBPTAmount * BPTPrice)}\n`);
    _print(`你在质押: ${yourBPTAmount} BPT (${toFixed(yourBPTAmount * 100 / totalStakedBPTAmount, 3)}% of the pool)`);
    _print(`          = [${USDCPerBPT * yourBPTAmount} USDC, ${MUSDPerBPT * yourBPTAmount} mUSD]`);
    _print(`          = ${toDollar(yourBPTAmount * BPTPrice)}\n`);

    // MTA REWARDS
    _print("======== MTA 奖励 ========")
    const weeklyEstimate = MTARewardPerBPT * yourBPTAmount;

    _print(`每日估算: ${toFixed(weeklyEstimate / 7, 2)} MTA = ${toDollar(weeklyEstimate * (1/7) * MTAPrice)} (out of total ${toFixed(weekly_reward / 7, 2)} MTA)`)
    _print(`每周估算: ${toFixed(weeklyEstimate, 2)} MTA = ${toDollar(weeklyEstimate * MTAPrice)} (out of total ${weekly_reward} MTA)\n`);
    const YFIWeeklyROI = (MTARewardPerBPT * MTAPrice) * 100 / (BPTPrice);

    _print(`每日投资回报率（美元）: ${toFixed(YFIWeeklyROI / 7, 4)}%`)
    _print(`每周投资回报率（美元）: ${toFixed(YFIWeeklyROI, 4)}%`)
    _print(`APY (unstable)        : ${toFixed(YFIWeeklyROI * 52, 4)}% \n`)

    // BAL REWARDS
    _print("======== BAL 奖励 ========")
    _print_href(`Check http://www.predictions.exchange/balancer/ for accurate %`, "https://www.predictions.exchange/balancer/")

    hideLoading();

}