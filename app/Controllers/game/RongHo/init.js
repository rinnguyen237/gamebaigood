
let fs           = require('fs');

let RongHo_phien = require('../../../Models/RongHo/RongHo_phien');
let RongHo_cuoc  = require('../../../Models/RongHo/RongHo_cuoc');
let RongHo_user  = require('../../../Models/RongHo/RongHo_user');

let UserInfo     = require('../../../Models/UserInfo');
let Helpers      = require('../../../Helpers/Helpers');

let botList    = [];

let RongHo = function(io){
	this.io           = io;
	this.clients      = {};
	this.time         = 0;
	this.timeInterval = null;
	this.phien        = 1;
	this.botList      = [];
	this.botCount     = 0;

	this.ingame = {red:{}, xu:{}};

	this.client   = io; // địa chỉ socket của người chơi

	this.chip = {
		'rong':   {'1000':0, '10000':0, '50000':0, '100000':0, '1000000':0},
		'ho':     {'1000':0, '10000':0, '50000':0, '100000':0, '1000000':0},
		'hoa':     {'1000':0, '10000':0, '50000':0, '100000':0, '1000000':0},
		'ro':   {'1000':0, '10000':0, '50000':0, '100000':0, '1000000':0},
		'co':   {'1000':0, '10000':0, '50000':0, '100000':0, '1000000':0},
		'bich': {'1000':0, '10000':0, '50000':0, '100000':0, '1000000':0},
		'tep': {'1000':0, '10000':0, '50000':0, '100000':0, '1000000':0},
	};

	this.data = {
		'red': {
			'rong':   0,
			'ho':     0,
			'hoa':   0,
			'ro':   0,
			'co': 0,
			'bich': 0,
			'tep': 0,
		},
		'xu': {
			'rong':   0,
			'ho':     0,
			'hoa':   0,
			'ro':   0,
			'co': 0,
			'bich': 0,
			'tep': 0,
		},
	};
	this.dataAdmin = {
		'red': {
			'rong':   0,
			'ho':     0,
			'hoa':   0,
			'ro':   0,
			'co': 0,
			'bich': 0,
			'tep': 0,
		},
		'xu': {
			'rong':   0,
			'ho':     0,
			'hoa':   0,
			'ro':   0,
			'co': 0,
			'bich': 0,
			'tep': 0,
		},
	};

	let self = this;
	RongHo_phien.findOne({}, 'id', {sort:{'_id':-1}}, function(err, last) {
		if (!!last){
			self.phien = last.id+1;
		}
		self.play();
		self = null;
	});
}

RongHo.prototype.play = function(){
	// chạy thời gian

	this.time = 43;

	this.timeInterval = setInterval(function(){
		let self = this;
		if (this.time < 30) {
			if (this.time < 0) {
				clearInterval(this.timeInterval);
				this.time = 0;

				this.resetData();

				this.resetDataAdmin();

				const name = ['1','2','3','4','5','6','7','8','9','10','11','12','13'];
				const type = ['♥', '♦', '♣', '♠'];


				let ronghojs = Helpers.getData('rongho');
				if(!!ronghojs){
					let rong = parseInt(ronghojs.rong == 0 ? name[Math.floor(Math.random() * 13) + 0] : ronghojs.rong);
					let ho = parseInt(ronghojs.ho == 0 ? name[Math.floor(Math.random() * 13) + 0] : ronghojs.ho);
					let chatho =  ronghojs.chatho == '' ? type[Math.floor(Math.random() * 4) + 0] : ronghojs.chatho;
					let chatrong =  ronghojs.chatrong == '' ? type[Math.floor(Math.random() * 4) + 0] : ronghojs.chatrong;

					ronghojs.rong = 0;
					ronghojs.ho = 0;
					ronghojs.chatho = '';
					ronghojs.chatrong = '';

					Helpers.setData('rongho', ronghojs);

					RongHo_phien.create({'rong':rong, 'ho':ho, 'chatho':chatho, 'chatrong':chatrong, 'time':new Date()}, function(err, create){
						if (!!create) {
							self.phien = create.id+1;
							self.thanhtoan([rong, ho, chatrong, chatho]);
							self.timeInterval = null;
							ronghojs          = null;
							Object.values(self.clients).forEach(function(client){
								client.red({rongho:{phien:create.id, finish:[rong, ho, chatrong, chatho]}});
							});
							Object.values(self.io.admins).forEach(function(admin){
								admin.forEach(function(client){
									client.red({rongho:{finish:[rong, ho, chatrong, chatho]}});
								});
							});
							self = null;
						}
					});
				}
				fs.readFile('./config/xocxoc.json', 'utf8', (errXX, bcXX) => {
					try {
						bcXX = JSON.parse(bcXX);
						if (bcXX.bot) {
							// lấy danh sách tài khoản bot
							UserInfo.find({type:true}, 'id name', function(err, blist){
								if (blist.length) {
									Promise.all(blist.map(function(buser){
										buser = buser._doc;
										delete buser._id;

										return buser;
									}))
									.then(result => {
										let maxBot = (result.length*50/100)>>0;
										botList = Helpers.shuffle(result);
										botList = botList.slice(0, maxBot);
										//console.log(botList[1]);
									});
								}
							});
						}else{
							botList = [];
						}
					} catch (error) {
						botList = [];
					}
				});

				let cc = Object.keys(this.clients).length+Math.floor(Math.random() * Math.floor(50))>>0;
				Object.values(this.clients).forEach(function(users){
				users.red({rongho:{ingame:{client:cc}}});
				}.bind(this));
			}else{
				this.thanhtoan();
				
				if (!!botList.length && this.time > 2) {
					let userCuoc = (Math.random()*5)>>0;
					for (let i = 0; i < userCuoc; i++) {
						let dataT = botList[i];
						if (!!dataT) {
							
							this.bot(dataT, this.client);
							botList.splice(i, 1); // Xoá bot đã đặt tránh trùng lặp
						}
						dataT = null;
					}
				}
				
			}
		}
		this.time--;
	}.bind(this), 1000);
	return void 0;
}

let truChietKhau = function(bet, phe){
	//console.log("on>>>>>>>>1");
	return bet-Math.ceil(bet*phe/100);
}

RongHo.prototype.thanhtoan = function(dice = null){
	// thanh toán phiên
	
	let self = this;
	if (!!dice) {

		let rong = dice[0];
		let ho = dice[1];
		let chatrong = dice[2];
		let chatho = dice[3];

		let phien = this.phien-1;

		RongHo_cuoc.find({phien:phien}, {}, function(err, list) {
			if (list.length) {
				Promise.all(list.map(function(cuoc){
					let tongDat   = cuoc.rong+cuoc.ho+cuoc.hoa+cuoc.ro+cuoc.co+cuoc.bich+cuoc.tep;
					let TienThang = 0; // Số tiền thắng (chưa tính gốc)
					let TongThua  = 0; // Số tiền thua
					let TongThang = 0; // Tổng tiền thắng (đã tính gốc)
					let thuong    = 0;
					//console.log(cuoc);
					// Cược Rong
					if (cuoc.rong > 0) {
						if (rong > ho) {
							//console.log('Rong win');
							TienThang += cuoc.rong;
							TongThang += truChietKhau(cuoc.rong*2,2);
						}else{
							TongThua  += cuoc.rong;
						}
					}
					// Cược Ho
					if (cuoc.ho > 0) {
						if (rong < ho) {
							//console.log('Ho win');
							TienThang += cuoc.ho;
							TongThang += truChietKhau(cuoc.ho*2,2);
						}else{
							TongThua  += cuoc.ho;
						}
					}
					// Hoa
					if (cuoc.hoa > 0) {
						if (rong === ho) {
							TienThang += cuoc.hoa;
							TongThang += truChietKhau(cuoc.hoa*16,2);
						}else{
							TongThua  += cuoc.hoa;
						}
					}
					// 4 đỏ
					if (cuoc.ro > 0) {
						if (chatrong === "♦" && chatho === "♦") {
							TienThang += cuoc.ro;
							TongThang += truChietKhau(cuoc.ro*15,2);
						}else{
							TongThua  += cuoc.ro;
						}
					}
					// 3 trắng
					if (cuoc.co > 0) {
						if (chatrong === "♥" && chatho === "♥") {
							TienThang += cuoc.co;
							TongThang += truChietKhau(cuoc.co*15,2);
						}else{
							TongThua  += cuoc.co;
						}
					}
					// 4 trắng
					if (cuoc.bich > 0) {
						if (chatrong === "♠" && chatho === "♠") {
							TienThang += cuoc.bich;
							TongThang += truChietKhau(cuoc.bich*15,2);
						}else{
							TongThua  += cuoc.bich;
						}
					}

					if (cuoc.tep > 0) {
						if (chatrong === "♣" && chatho === "♣") {
							TienThang += cuoc.tep;
							TongThang += truChietKhau(cuoc.tep*15,2);
						}else{
							TongThua  += cuoc.tep;
						}
					}

					let update     = {};
					let updateGame = {};

					cuoc.thanhtoan = true;
					cuoc.betwin    = TongThang;
					cuoc.save();

					if (cuoc.red) {
						//RED
						if (TongThang > 0) {
							update['red'] = TongThang;
						}
						if (TienThang > 0) {
							update['redWin'] = updateGame['red'] = TienThang;
						}
						if (TongThua > 0) {
							update['redLost'] = updateGame['red_lost'] = TongThua;
						}

						update['redPlay'] = updateGame['redPlay'] = tongDat;

						UserInfo.updateOne({id:cuoc.uid}, {$inc:update}).exec();
						RongHo_user.updateOne({uid:cuoc.uid}, {$inc:updateGame}).exec();
					}
					if(void 0 !== self.clients[cuoc.uid]){
						let status = {};
						if (TongThang > 0) {
							status = {rongho:{status:{win:true, bet:TongThang, thuong:thuong}}};
						}else{
							status = {rongho:{status:{win:false, bet:TongThua}}};
						}
						self.clients[cuoc.uid].red(status);
						status = null;
					}

					TongThua   = null;
					TongThang  = null;
					thuong     = null;

					tongDat    = null;
					update     = null;
					updateGame = null;
					return {users:cuoc.name, bet:TienThang, red:cuoc.red};
				}))
				.then(function(arrayOfResults) {
					phien = null;
					dice = null;
					rong   = null;
					ho   = null;
					chatrong = null;
					chatho = null;
					arrayOfResults = arrayOfResults.filter(function(st){
						return (st.red && st.bet > 0);
					});
					self.play();
					if (arrayOfResults.length) {
						arrayOfResults.sort(function(a, b){
							return b.bet-a.bet;
						});

						arrayOfResults = arrayOfResults.slice(0, 10);
						arrayOfResults = Helpers.shuffle(arrayOfResults);

						Promise.all(arrayOfResults.map(function(obj){
							return {users:obj.users, bet:obj.bet, game:'Rồng Hổ'};
						}))
						.then(results => {
							self.io.sendInHome({news:{a:results}});
							results = null;
							arrayOfResults = null;
							self = null;
						});
					}else{
						self = null;
					}
				});
			}else{
				phien = null;
				dice = null;
				rong   = null;
				ho   = null;
				chatrong = null;
				chatho = null;

				self.play();
				self = null;
			}
		});
	}else{
		Object.values(this.clients).forEach(function(client){
			client.red({rongho:{client:self.data}});
		});

		///**
		let admin_data = {rongho:{info:this.dataAdmin, ingame:this.ingame}};
		Object.values(this.io.admins).forEach(function(admin){
			admin.forEach(function(client){
				if (client.gameEvent !== void 0 && client.gameEvent.viewRongHo !== void 0 && client.gameEvent.viewRongHo){
					client.red(admin_data);
				}
			});
		});
		//*/
		self = null;
	}
}

RongHo.prototype.resetData = function(){
	this.data.red.rong =   0;
	this.data.red.ho =     0;
	this.data.red.hoa =   0;
	this.data.red.ro =   0;
	this.data.red.co = 0;
	this.data.red.bich = 0;
	this.data.red.tep = 0;

	this.data.xu.rong =   0;
	this.data.xu.ho =     0;
	this.data.xu.hoa =   0;
	this.data.xu.ro =   0;
	this.data.xu.co = 0;
	this.data.xu.bich = 0;
	this.data.xu.tep = 0;

	this.chip.rong['1000']    = 0;
	this.chip.rong['10000']   = 0;
	this.chip.rong['50000']   = 0;
	this.chip.rong['100000']  = 0;
	this.chip.rong['1000000'] = 0;

	this.chip.ho['1000']    = 0;
	this.chip.ho['10000']   = 0;
	this.chip.ho['50000']   = 0;
	this.chip.ho['100000']  = 0;
	this.chip.ho['1000000'] = 0;

	this.chip.hoa['1000']    = 0;
	this.chip.hoa['10000']   = 0;
	this.chip.hoa['50000']   = 0;
	this.chip.hoa['100000']  = 0;
	this.chip.hoa['1000000'] = 0;

	this.chip.ro['1000']    = 0;
	this.chip.ro['10000']   = 0;
	this.chip.ro['50000']   = 0;
	this.chip.ro['100000']  = 0;
	this.chip.ro['1000000'] = 0;

	this.chip.co['1000']    = 0;
	this.chip.co['10000']   = 0;
	this.chip.co['50000']   = 0;
	this.chip.co['100000']  = 0;
	this.chip.co['1000000'] = 0;

	this.chip.bich['1000']    = 0;
	this.chip.bich['10000']   = 0;
	this.chip.bich['50000']   = 0;
	this.chip.bich['100000']  = 0;
	this.chip.bich['1000000'] = 0;

	this.chip.tep['1000']    = 0;
	this.chip.tep['10000']   = 0;
	this.chip.tep['50000']   = 0;
	this.chip.tep['100000']  = 0;
	this.chip.tep['1000000'] = 0;
};

RongHo.prototype.resetDataAdmin = function(){
	this.ingame.red = {};
	this.ingame.xu  = {};

	this.dataAdmin.red.rong =   0;
	this.dataAdmin.red.hoa =     0;
	this.dataAdmin.red.ho =   0;
	this.dataAdmin.red.ro =   0;
	this.dataAdmin.red.co = 0;
	this.dataAdmin.red.tep = 0;
	this.dataAdmin.red.bich = 0;

	this.dataAdmin.xu.rong =   0;
	this.dataAdmin.xu.hoa =     0;
	this.dataAdmin.xu.ho =   0;
	this.dataAdmin.xu.ro =   0;
	this.dataAdmin.xu.co = 0;
	this.dataAdmin.xu.tep = 0;
	this.dataAdmin.xu.bich = 0;
};

RongHo.prototype.bot = function(users, client){

	let random = function(){
		return Math.floor(Math.random() * Math.floor(10));
		return (Math.random()*(1000))>>0;
	};

	let getRandomInt = function(max) {
		return Math.floor(Math.random() * Math.floor(max));
	};
	
	let listbox = ['rong','hoa','ho','ro','co','bich','tep'];
	let listcuoc   = ['1000','10000','50000','100000','1000000'];
	let select = !!((Math.random()*2)>>0);
	let rongho = client.rongho;
	let cuoc = listcuoc[getRandomInt(5)]>>0;
	let box  = listbox[getRandomInt(7)];
	let red = true;
	let phien = rongho.phien;

	rongho.chip[box][cuoc] += 1;
	let newData = {
		'rong':   0,
		'ho':     0,
		'hoa':   0,
		'ro':   0,
		'co': 0,
		'bich': 0,
		'tep': 0,
	};

	newData[box] = cuoc;
	let me_cuoc = {};
	if (red) {
		rongho.data.red[box] += cuoc;
		rongho.dataAdmin.red[box] += cuoc;
		if (rongho.ingame.red["bot"]) {
			rongho.ingame.red["bot"][box] += cuoc;
		}else{
			rongho.ingame.red["bot"] = newData;
		}
		me_cuoc.red = rongho.ingame.red["bot"];
	}
	
	Object.values(rongho.clients).forEach(function(users){
		if (client !== users) {
			users.red({rongho:{chip:{box:box, cuoc:cuoc}}});
		}else{
			users.red({rongho:{mechip:{box:box, cuoc:data.cuoc}, me:me_cuoc}, user:{red:user.red, xu:user.xu}});
		}
	});

	rongho  = null;
	me_cuoc = null;
	newData = null;
	client  = null;
	data    = null;

	cuoc = null;
	red  = null;
	box  = null;

	bot = null;
	select = null;
}

RongHo.prototype.updateUsers = function(){
}

module.exports = RongHo;
