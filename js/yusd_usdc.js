$(function() {
    consoleInit();
    start(main);
});

async function main() {

    const App = await init_ethers();

    _print(`初始化 ${App.YOUR_ADDRESS}`);
    _print("阅读智能合约...");

    const YUSD_USDC_BALANCER_POOL = new ethers.Contract(YUSD_USDC_BPT_TOKEN_ADDR, BALANCER_POOL_ABI, App.provider);
    const YUSD_USDC_BPT_TOKEN = new ethers.Contract(YUSD_USDC_BPT_TOKEN_ADDR, ERC20_ABI, App.provider);

    const totalBPTAmount = await YUSD_USDC_BALANCER_POOL.totalSupply() / 1e18;
    const yourBPTAmount = await YUSD_USDC_BPT_TOKEN.balanceOf(App.YOUR_ADDRESS) / 1e18;

    const totalYUSDSEP20Amount = await YUSD_USDC_BALANCER_POOL.getBalance(YUSDSEP20_TOKEN_ADDR) / 1e18;
    const totalUSDCAmount = await YUSD_USDC_BALANCER_POOL.getBalance(USDC_ADDRESS) / 1e6;


    const YUSDSEP20PerBPT = totalYUSDSEP20Amount / totalBPTAmount;
    const USDCPerBPT = totalUSDCAmount / totalBPTAmount;

    // Find out reward rate
    const weekly_reward = 25000; // 25k UMA every week
    const UMARewardPerBPT = weekly_reward / (totalBPTAmount - 100);

    _print("已阅读完智能合约... 正在查找价格... \n")

    // Look up prices
    const prices = await lookUpPrices(["usd-coin", "uma"]);
    const USDCPrice = prices["usd-coin"].usd;
    const UMAPrice = prices["uma"].usd;
    const YUSDSEP20Price = (await YUSD_USDC_BALANCER_POOL.getSpotPrice(USDC_ADDRESS, YUSDSEP20_TOKEN_ADDR) /1e6) * USDCPrice;

    const BPTPrice = YUSDSEP20PerBPT * YUSDSEP20Price + USDCPerBPT * USDCPrice;

    // Finished. Start printing

    _print("========== 价格比 ==========")
    _print(`1 UMA        = $${UMAPrice}`);
    _print(`1 yUSD-SEP20 = $${YUSDSEP20Price}`);
    _print(`1 USDC       = $${USDCPrice}\n`);
    _print(`1 BPT        = [${YUSDSEP20PerBPT} yUSD-SEP20, ${USDCPerBPT} USDC]`);
    _print(`             = ${toDollar(BPTPrice)}\n`);

    _print("========== 质押 =========")
    _print(`总共有     : ${totalBPTAmount} BPT issued by yUSD-USDC Balancer Pool.`);
    _print(`            = ${toDollar(totalBPTAmount * BPTPrice)}\n`);
    _print(`你在质押   : ${yourBPTAmount} BPT (${toFixed(yourBPTAmount * 100 / totalBPTAmount, 3)}% of the pool)`);
    _print(`            = [${YUSDSEP20PerBPT * yourBPTAmount} yUSD, ${USDCPerBPT * yourBPTAmount} USDC]`);
    _print(`            = ${toDollar(yourBPTAmount * BPTPrice)}\n`);

    // UMA REWARDS
    _print("======== UMA 奖励 ========")
    _print(`每周估算   : ${toFixed(UMARewardPerBPT * yourBPTAmount, 2)} UMA = ${toDollar(UMARewardPerBPT * yourBPTAmount * UMAPrice)} (out of total ${weekly_reward} UMA)`)
    const UMAWeeklyROI = (UMARewardPerBPT * UMAPrice) * 100 / (BPTPrice);
    _print(`每周投资回报率（美元）: ${toFixed(UMAWeeklyROI, 4)}%`)
    _print(`年利率 (不稳定)       : ${toFixed(UMAWeeklyROI * 52, 4)}% \n`)

    // BAL REWARDS
    _print("======== BAL 奖励 ========");
    _print_href(`Check http://www.predictions.exchange/balancer/ for accurate %`, "https://www.predictions.exchange/balancer/");

    hideLoading();

}