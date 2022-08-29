require("dotenv").config();
const ccxt = require("ccxt");

const Combinations = (marketSymbols, base) => {
    let combinations = [];
    for (const sym1 of marketSymbols) {
        const sym1Token1 = sym1.split("/")[0];
        const sym1Token2 = sym1.split("/")[1];
        if (sym1Token2 == base) {
            for (const sym2 of marketSymbols) {
                const sym2Token1 = sym2.split("/")[0];
                const sym2Token2 = sym2.split("/")[1];
                if (sym1Token1 == sym2Token2) {
                    for (const sym3 of marketSymbols) {
                        const sym3Token1 = sym3.split("/")[0];
                        const sym3Token2 = sym3.split("/")[1];
                        if (sym2Token1 == sym3Token1 && sym3Token2 == sym1Token2) {
                            const combination = {
                                base: sym1Token2,
                                intermediate: sym1Token1,
                                ticker: sym2Token1,
                            };
                            combinations.push(combination);
                        }
                    }
                }
            }
        }
    }
    return combinations;
};
const Start = async () => {
    for (const item of process.env.EXCHANGES.split(" ")) {
        const exchange = new ccxt[item.toLowerCase()]({
            apiKey: process.env[`${item}_API`],
            secret: process.env[`${item}_SECRET`],
        });
        const marketSymbols = (await exchange.fetchMarkets()).map((item) => item.symbol.toUpperCase());
        const combinations = Combinations(marketSymbols, process.env.BASE);
        for (const tickers of combinations) {
            const res1 = await exchange.fetchTicker(`${tickers.intermediate}/${tickers.base}`);
            const res2 = await exchange.fetchTicker(`${tickers.ticker}/${tickers.intermediate}`);
            const res3 = await exchange.fetchTicker(`${tickers.ticker}/${tickers.base}`);

            if (res1.ask && res2.ask && res3.bid && (((process.env.TRADING_AMOUNT / res1.ask / res2.ask) * res3.bid - process.env.TRADING_AMOUNT) / process.env.TRADING_AMOUNT) * 100 > process.env.MIN_PERCENTAGE_PROF) {
                console.log(`Route: ${tickers.base} ==> ${tickers.intermediate} ==> ${tickers.ticker} ==> ${tickers.base}\nProfit: ${(((process.env.TRADING_AMOUNT / res1.ask / res2.ask) * res3.bid - process.env.TRADING_AMOUNT) / process.env.TRADING_AMOUNT) * 100} %`);
            }
            if (res1.bid && res2.bid && res3.ask && (((process.env.TRADING_AMOUNT / res3.ask) * res2.bid * res1.bid - process.env.TRADING_AMOUNT) / process.env.TRADING_AMOUNT) * 100 > process.env.MIN_PERCENTAGE_PROF) {
                console.log(`Route: ${tickers.base} ==> ${tickers.ticker} ==> ${tickers.intermediate} ==> ${tickers.base}\nProfit: ${(((process.env.TRADING_AMOUNT / res3.ask) * res2.bid * res1.bid - process.env.TRADING_AMOUNT) / process.env.TRADING_AMOUNT) * 100} %`);
            }
        }
    }
};
Start();
