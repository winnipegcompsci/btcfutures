// Load Requirements. ///////////////////////////////////////////////////////////////////
var crypto = require('crypto');
var clc = require('cli-color');

var expected_hmac;
var verb;
var url;
var nonce; 
var data;

// GET TEST /////////////////////////////////////////////////////////////////////////////
expected_hmac = '9f1753e2db64711e39d111bc2ecace3dc9e7f026e6f65b65c4f53d3d14a60e5f';
verb = 'GET'
url = '/api/v1/instrument?filter=%7B%22symbol%22%3A+%22XBTM15%22%7D';
nonce = 1429631577690;
data = '';
test_hmac(verb, url, nonce, data, expected_hmac);

// POST TEST ////////////////////////////////////////////////////////////////////////////
expected_hmac = 'c8f371f0bdae96fd6b4a4d506632b5832982c5143f5c22973bc08d2f56a8beaf';   
verb = 'POST';
url = '/api/v1/order';
nonce = once = 1429631577995
data = '{"symbol":"XBTM15","price":219.0,"clOrdID":"mm_bitmex_1a/oemUeQ4CAJZgP3fjHsA","quantity":98}'
test_hmac(verb, url, nonce, data, expected_hmac);


function test_hmac(verb, url, nonce, data, expected_result) {
    var apiKey = 'LAqUlngMIQkIUjXMUreyu3qn';
    var apiSecret = 'chNOOS4KvNXR_Xq4k4c9qsfoKWvnDecLATCRlcBwyKDYnWgO';
    
    var hmac = crypto.createHmac('sha256', apiSecret);
    hmac.setEncoding('hex');
    
    hmac.write(verb + url + nonce + data);
    hmac.end();
    
    var result = hmac.read();
    
    if(result === expected_result) {
        console.log(clc.green('\n%s HMAC TEST PASSED'), verb);
    } else {
        console.log(clc.red('\n%s HMAC TEST FAILED'), verb);
    }
    
    console.log('%s EXPECTED HMAC: \t' + expected_result, verb);
    console.log('%s HMAC GENERATED: \t' + result, verb);
}
