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
A check is run every (X) seconds if btc is below (Y) and (Q) is < (A)  and (C) is < (S) 
        it buys (B) out of the pending order  (A) to a max of (A)

It then follows this logic.

if (O) goes up 1.25% above (W),  it sells ‘(R)*(I)’  once the insurance is sold, 
    it waits for (O) to get to a 2.5%  gain over (W)  
        it then sells half of (Q), 
    if (O) keeps going up, at 4% over (W)  
        it reopens insurance again using ‘(Q) * (I) / 2’ 

If (O) goes down after selling insurance it stops out at ‘(W) + 0.5% to 1.25%’  (full position)  

If (O) goes straight down before insurance is sold, once it is 1.25% below (W) it buys additional insurance at (Q) * (I)  and adds 10% of (Q) to (Q) for every $1 it goes down,  stepping up 10% for the first $3 and then 5% for each additional $


Ie:  10%, 20%, 30%, 35%, 40%, 45%, 50%, 55%, 60%, 65%, 70%, 75%, 85%, 90% to the position for each $ it goes down.

It should prompt for: 

A, Y,  I

/* SHORT HEDGE ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */
A check is run every (x) seconds if BTC is below (Y) and (Q) is < (A) and (C) is < (S) it buys B out of pending order (A) to a max of (A).

If (o) goes down 1.25% below (W), it sells '(R*I)' insureance, once insurance is sold it waits for (O) to get to a 2.5% gAIN OVER (w) THEN SELLS  HALF OF (Q) if (o)