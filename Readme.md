/* SCENARIO |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */
Scenario:

Want to maintain a hedge for 100 coins biased long with a 70% coverage rate, we don’t want to enter any new positions if the market passes $300.

A = total amount of coins to hedge (100)
B  = 10 BTC +/- 40% randomly (as to obscure bot operations)
X = 10 seconds +/- 40% randomly (as to obscure bot operations)
Y = The price at which we want to stop entering new hedging positions ($300)
Q = The total current open long position
R = The current amount insured
S = The spread between the last trade price of Okcoin and 796 averaged over the past 3 hours + 10%
C = The current spread between okc and 796
W = average cost of OKCoin position
O = OKcoin LTP
I = Insurance coverage rate %


/* LONG HEDGE |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */
Every X Seconds: {
    if(OKCOIN_LTP < MAX_BUY_PRICE && TOTAL_CURRENT_LONG < MAX_COINS_TO_HEDGE && CURRENT_SPREAD < AVERAGE_SPREAD) {
        BUY 10 BTC / 100 BTC Limit (MAX_COINS_TO_HEDGE).
    }
    
    if(OKCOIN_LTP > OKC_AVERAGE_PRICE * 1.0125) {
        Sell INSURANCE_COVERAGE_RATE * AMOUNT_INSURED Insurance (SHORT)
        
        if(OKCOIN_LTP > OKC_AVERAGE_PRICE * 1.0250) {
            SELL HALF OF TOTAL CURRENT LONG
        }
        
        if(OKCOIN_LTP > OKC_AVERAGE_PRICE * 1.04) {
            BUY INSURANCE USING TOTAL_CURRENT_LONG * INSURANCE_COVERAGE_RATE / 2;
        }
    }
    
    if(OKCOIN_LTP < OKC_AVERAGE_PRICE*1.005) {
        Sell Total Current Long (Close Out)
    }
    
    if(OKCOIN_LTP < OKC_AVERAGE_PRICE/1.0125) {
        BUY ADDITIONAL INSURANCE @ TOTAL_CURRENT_LONG * INSURANCE_COVERAGE_RATE;
    }
}

/* SHORT HEDGE ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */
Every X Seconds: {
    if(OKCOIN_LTP > MAX_BUY_PRICE && TOTAL_CURRENT_SHORT < MAX_COINS_TO_HEDGE && CURRENT_SPREAD > AVERAGE_SPREAD) {
        BUY 10 BTC / 100 BTC Limit (MAX_COINS_TO_HEDGE)
    }
    
    if(OKCOIN_LTP < OKC_AVERAGE_PRICE / 1.0125) {\
        SELL INSURANCE_COVERAGE_RATE * AMOUNT_INSURED Insurance (LONG)
    
        if(OKCOIN_LTP < OKC_AVERAGE_PRICE / 1.0250) {
            SELL HALF OF TOTAL CURRENT SHORT
        }
        
        if(OKCOIN_LTP < OKC_AVERAGE_PRICE / 1.04) {
            BUY INSURANCE USING TOTAL_CURRENT_SHORT * INSURANCE_COVERAGE_RATE / 2;
        }
    }
    
    if(OKCOIN_LTP > OKC_AVERAGE_PRICE*1.005) {
        Sell Total Current Short (CLOSE OUT)
    }
    
    if(OKCOIN_LTP < OKC_AVERAGE_PRICE*1.0125) {
        Buy Additional Long @ TOTAL_CURRENT_SHORT * INSURANCE_COVERAGE_RATE;
    }
}