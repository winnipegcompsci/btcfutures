// TESTING BTCSTATS.

var btcstats = require('btc-stats');
var OKCoin = require('okcoin');

var util = require('util');

// var data = {};

function getStats() {
    //var activeExchanges = ["bitfinex", "bitstamp", "okcoin", "btce", "sevenninesix", "bitvc"];
    var activeExchanges = ['okcoin', 'sevenninesix', 'bitfinex', 'bitstamp', 'btce'];
    
    btcstats.exchanges(activeExchanges);
    console.log("Fetching data from: {" + activeExchanges + "}");
    var data = {};

    var MongoClient = require('mongodb').MongoClient;
    
    btcstats.avg(function(error, resp) {
        if(!error) {
            data.average = resp;

            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('average_prices').insert(resp);
                db.close();
            });
        }
        
        checkdone(data);
    });

    btcstats.weightedAvg(function(error, resp) {
        if(!error) {
            data.vwap = resp.price;
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('vwap_prices').insert(resp);
                db.close();
            });
        }
        
        checkdone(data);
    });
    
    btcstats.min(function(error, resp) {
        if(!error) {
            data.minPrice = resp;
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('min_prices').insert(resp);
                db.close();
            });
        }
        
        checkdone(data);
    });
    
    btcstats.max(function(error, resp) {
        if(!error) {
            data.maxPrice = resp;
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('max_prices').insert(resp);
                db.close();
            });
        }
        
        checkdone(data);
    });

    btcstats.minSpread(function(error, resp) {
        if(!error) {
            data.minSpread = resp;
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('min_spread').insert(resp);
                db.close();
            });
        }
        
        checkdone(data);
    });
    
    btcstats.maxSpread(function(error, resp) {
        if(!error) {
            data.maxSpread = resp;
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('max_spread').insert(resp);
                db.close();
            });
        }
        
        checkdone(data);
    });    
    
    btcstats.minVolume(function(error, resp) {
        if(!error) {
            data.minVolume = resp;
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('min_volume').insert(resp);
                db.close();
            });
        }
        
        checkdone(data);
    });
    
    btcstats.maxVolume(function(error, resp) {
        if(!error) {            
            data.maxVolume = resp;
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('max_volume').insert(resp);
                db.close();
            });
        }
        
        checkdone(data);
    });
    
}

function checkdone(data) {   
    if(Object.keys(data).length == 8) {
        var numSeconds = 10;
        
        console.log("\nData: \n" + util.inspect(data));
        console.log("Fetching data in %s seconds", numSeconds);
        setTimeout(getStats, numSeconds * 1000);
    }
}

getStats();