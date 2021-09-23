var tabTranDau   = require('../../../../Models/BongDa/BongDa');

module.exports = function(client, data) {
	tabTranDau.findOne({'_id':data}, function(err, info){
        if (!!info) {
            info.blacklist = 1;
            info.save();
            tabTranDau.find({'blacklist':0}, function(err, tab){
                client.red({bongda:{data:tab}, notice:{title:'VIPRIK BET',text:'Xóa thành công'}});
            });
            //client.red({notice:{title:'VIPRIK BET',text:'Xóa thành công'}});
        }else{
            client.red({notice:{title:'VIPRIK BET',text:'Dữ liệu không đúng..'}});
        }
	});
}