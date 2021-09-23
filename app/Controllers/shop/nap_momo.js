const _ = require('lodash');
let request = require('request');
var UserInfo      = require('../../Models/UserInfo');
var MomoBonus = require('../../../config/momo.json');
let Bank_history = require('../../Models/Bank/Bank_history');
var validator     = require('validator');
var helper        = require('../../Helpers/Helpers');
let apikey = `3604bb00-1263-4570-9f21-dc015bc45eee`;

module.exports = function(client, data){
    if (!!data && !!data.sotien && !!data.captcha) {
        let money = data.sotien>>0;
        // if (!validator.isLength(data.captcha, { min: 4, max: 4 })) {
        //     client.red({ notice: { title: '', text: 'Captcha không đúng!', load: false } });
        // }else
         if (validator.isEmpty(data.sotien)) {
            client.red({ notice: { title: '', text: 'Vui lòng nhập số tiền nạp!', load: false } });
        }else if (money < MomoBonus.min) {
			client.red({notice: {title:'LỖI', text: `Nạp tối thiểu ${helper.numberWithCommas(MomoBonus.min)}, tối đa ${helper.numberWithCommas(MomoBonus.max)}`, load: false }});
		}else{
            //let checkCaptcha = new RegExp('^' + data.captcha + '$', 'i');
            //checkCaptcha = checkCaptcha.test(client.captcha);
            let checkCaptcha = true;
            if (checkCaptcha) {
                let request_id = ''+Math.floor(Math.random() * Math.floor(99999999999999)) * 2 + 1;
				//let url = `https://no86.club/momo.json`;
                let url = `http://mopay3.vnm.bz:10007/api/MM/RegCharge?chargeType=momo&amount=${money}&apiKey=${apikey}&requestId=${request_id}`;
                request.get({
                    url: url,
                    headers: {'Content-Type': 'application/json'}
                }, function (err, httpResponse, body){
                    try{
                        data = JSON.parse(body);
                        if (data.stt == 1) {
                            UserInfo.findOne({id: client.UID}, 'name', function(err, check){
                                //let data = Buffer.from(body.destinationInfo, 'base64').toString();
                                let nap = new Object();
                                nap.syntax = data.data.code;
                                nap.phone = data.data.phoneNum;
                                nap.name = data.data.phoneName;

                                Bank_history.create({uid:client.UID ,transId: nap.syntax,bank:"momo", number:nap.phone, name:nap.name, namego:check.name, hinhthuc:1, money:money, time:new Date()});
                                
                                client.red({ shop:{momo:{nap:nap}}});
                                client.red({ notice: { title: '', text: `Vui lòng chuyển tiền tới \n` + data.data.phoneNum, load: false } });
                            });
                        }else{
                            client.red({ notice: { title: '', text: 'Yêu cầu nạp thẻ thất bại', load: false } }); 
                        } 
                    }catch(e){
                        console.log(`??????`);
                        client.red({ notice: { title: '', text: 'Yêu cầu nạp thẻ thất bại', load: false } }); 
                    }
                });  
            }
            else{
                client.red({ notice: { title: '', text: 'Mã xác nhận không chính xác!', load: false } });
            }
        }
    }
    client.c_captcha('momoController');

}