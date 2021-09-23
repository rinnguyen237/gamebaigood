const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var Admin = require('../../Models/Admin');
var OTP = require('../../Models/OTP');
var Users = require('../../Models/Users');
var config = require('../../../config');
var UserInfo = require('../../Models/UserInfo');
var Telegram = require('../../Models/Telegram');
var DaiLy = require('../../Models/DaiLy');
var secret = config.secret;
module.exports = function (req, res) {
    var Data = req.body.Data || {};
    var username = Data.username;
    var checkIpBan = req.headers['cf-connecting-ip'];
    var otp = Data.otp;
    username = username ? username.toLowerCase() : username;
    var password = Data.password;
    var errors = {};
            Promise.all([
                Admin.findOne({ 'username': username }),
                Users.findOne({ 'local.username': username })
            ])
                .then(response => {
                    var admin = response[0];
                    var user = response[1];
                    var lastInfo = admin ? admin : (user ? user.local : null);
                    if (!lastInfo) {
                        errors.username = "Tài khoản không tồn tại";
                        return res.json({
                            status: 201,
                            data: errors
                        });
                    } else {
                        if (admin) {
                            bcrypt.compare(password, lastInfo.password)
                                .then(isMatch => {
                                    if (isMatch) {
                                        OTP.findOne({
                                            'uid': admin.token
                                        }, {}, {
                                            sort: {
                                                '_id': -1
                                            }
                                        }, function (err1, data_otp) {
                                            if (!!data_otp && data_otp.code == otp) {
                                                if (((new Date() - Date.parse(data_otp.date)) / 1000) > 180 || data_otp.active) { //ignore check otp expire
                                                    errors.otp = "OTP đã hết hạn sử dụng";

                                                    res.json({
                                                        status: 400,
                                                        data: errors
                                                    })
                                                } else {
                                                    const payload = {
                                                        id: lastInfo._id,
                                                        name: admin.username,
                                                        nickname: admin.username,
                                                        rights: lastInfo.rights,
                                                        uid: admin.token
                                                    };
                                                    console.log(payload);
                                                    jwt.sign(payload, secret, { expiresIn: 360000 * 24 },
                                                        (err, token) => {
                                                            if (err) {
                                                                res.json({
                                                                    status: 500,
                                                                    data: err
                                                                })
                                                            }
                                                            console.log(payload);
                                                            data_otp.active = true;
                                                            data_otp.save();
                                                            res.json({
                                                                success: true,
                                                                token: `${token}`,
                                                                data: {
                                                                    username: lastInfo.username,
                                                                    rights: lastInfo.rights,
                                                                    regDate: lastInfo.regDate,
                                                                    nickname: lastInfo.username
                                                                }
                                                            })
                                                        });
                                                }
                                            } else {
                                                //ignore check otp expire
                                                errors.otp = "Mã OTP không chính xác";
                                                res.json({
                                                    status: 400,
                                                    data: errors
                                                })

                                            }
                                        })
                                    } else {
                                        errors.password = "Thông tin đăng nhập không chính xác";
                                        res.json({
                                            status: 400,
                                            data: errors
                                        })
                                    }
                                });
                        } else {
                            UserInfo.findOne({
                                id: user._id
                            }).then(function (userInfo) {
                                if (userInfo) {
                                    DaiLy.findOne({
                                        nickname: userInfo.name
                                    }, function (err,daili) {
                                        if (daili) {
                                            bcrypt.compare(password, lastInfo.password)
                                                .then(isMatch => {
                                                    if (isMatch) {
                                                        OTP.findOne({
                                                            'uid': user._id
                                                        }, {}, {
                                                            sort: {
                                                                '_id': -1
                                                            }
                                                        }, function (err1, data_otp) {
                                                            if (!!data_otp && data_otp.code == otp) {
                                                                if (((new Date() - Date.parse(data_otp.date)) / 1000) > 180 || data_otp.active) { //ignore check otp expire
                                                                    errors.otp = "OTP đã hết hạn sử dụng";
                                                                    res.json({
                                                                        status: 400,
                                                                        data: errors
                                                                    })
                                                                } else {
                                                                    const payload = {
                                                                        id: user._id,
                                                                        name: lastInfo.username,
                                                                        rights: daili.rights,
                                                                        nickname: userInfo.name,
                                                                        uid: user._id
                                                                    };
                                                                    UserInfo.updateOne({
                                                                        id: user._id
                                                                    }, { $set: { 'ip': checkIpBan } });
                                                                    jwt.sign(payload, secret, { expiresIn: 360000 * 24 },
                                                                        (err, token) => {
                                                                            if (err)
                                                                                res.json({
                                                                                    status: 500,
                                                                                    data: err
                                                                                });
                                                                            data_otp.active = true;
                                                                            data_otp.save();
                                                                            res.json({
                                                                                success: true,
                                                                                token: `${token}`,
                                                                                data: {
                                                                                    username: lastInfo.username,
                                                                                    regDate: lastInfo.regDate,
                                                                                    rights: daili.rights,
                                                                                    nickname: userInfo.name,
                                                                                    id: user._id
                                                                                }
                                                                            });
                                                                        });
                                                                }
                                                            } else {
                                                                //if (((new Date() - Date.parse(data_otp.date)) / 1000) > 180 || data_otp.active) { //ignore check otp expire
                                                                errors.otp = "Mã OTP không chính xác";
                                                                res.json({
                                                                    status: 400,
                                                                    data: errors
                                                                })
                                                                //}
                                                            }
                                                        })
                                                    } else {
                                                        errors.password = "Thông tin đăng nhập không chính xác";
                                                        res.json({
                                                            status: 400,
                                                            data: errors
                                                        })
                                                    }
                                                });
                                        } else {
                                            errors.username = "Bạn không có quyền Truy cập";
                                            return res.json({
                                                status: 403,
                                                data: errors
                                            });
                                        }
                                    });
                                } else {
                                    errors.username = "Tài khoản không tồn tại";
                                    return res.json({
                                        status: 201,
                                        data: errors
                                    });
                                }
                            });
                        }
                    }

                });
};