const vm=require('vm'),fs=require('fs'),assert=require('assert/strict');const context={window:{REDRAFT_SELECTED_YEAR:2010},document:{addEventListener(){}},Set,String};vm.createContext(context);for(const f of ['verified-portraits.js','photo-fallbacks.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);const photo=context.window.photo;
assert.equal(photo({name:'Jordy Nelson',pos:'WR',season:2010,team:'GB'}),'');
assert.equal(photo({name:'Unknown Player',pos:'RB',espnId:'11258'}),'');
assert.equal(photo({name:'Adrian Peterson',pos:'RB',season:2003,team:'CHI'}),'');
assert.equal(photo({name:'Adrian Peterson',pos:'RB',season:2010,team:'CHI'}),'');
assert(photo({name:'Adrian Peterson',pos:'RB',season:2010,team:'MIN'}).endsWith('/10452.png'));
assert(photo({name:'Chris Johnson',pos:'RB',season:2010,team:'TEN'}).endsWith('/11258.png'));
assert.equal(photo({name:'Chris Johnson',pos:'CB',season:2010,team:'OAK'}),'');
console.log('Portrait identity, position, historical-name collision and unknown-player checks passed.');
