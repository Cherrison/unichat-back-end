let express = require('express');
let router = express.Router();
let createError = require('http-errors'); // http-errors：处理错误中间件。
const querystring = require('querystring');
let fs = require('fs');
let path = require('path');
// 引入导入模块
const multiparty = require('multiparty');

let join = path.join;

router.get('/', function(req, res, next) {
    res.render('upload', { title: '上传文件' });
});
router.get('/download', (req, res, next)=>{
    res.render('download', { title: '下载文件' });
});
// 获取所有的用户目录
router.get('/dirs', function (req, res, next) {
    let filePath = global.Data.filePath;
    let dirs;
    fs.readdir(filePath, (err, data)=>{
        if(err){
            res.status(500).send({Status:'Fail',
err_msg: '服务器内部错误'});
            throw err;
        }
        dirs = data;
        let dirInfo = [];
        dirs.forEach((item)=>{
            let fpath = join(filePath, item);
            let stat = fs.statSync(fpath);
            let dir = {};
            if (stat.isDirectory() === true) {
                dir.userDir = path.basename(fpath);
                dir.count = fs.readdirSync(fpath).length;
                dir.createTime = stat.birthtime;
                dirInfo.push(dir);
            }
        });
        res.json({Status:'OK',
data: dirInfo });
    });
});
// 获取文件详情信息(需要指定用户)
router.get('/getFileInfo', (req, res) => {
    let getParse = querystring.parse(req.url.split('?')[1]);
	let userDir = req.session.user.uid;
    let limit = getParse.limit;
    let start = getParse.start;
    let getAll = getParse.getAll;
    let count = 0; // 当getAll 为true时返回统计的个数

    res.setHeader('Content-Type', 'application/json');
    if(!userDir){
        let err_info = {
            status: 'Fail',
            error_msg: '没有用户名'
        };
        res.send(err_info);
        return;
    }
    let filePath = global.Data.filePath;
    filePath += userDir;
    console.log(filePath);

    let fileInfo = [];

    let files;
    try {files = fs.readdirSync(filePath);}
    catch (e) {
        if(!files) {
            let err_info = {
                status: 'Fail',
                error_msg: '用户文件夹不存在'
            };
            res.send(err_info);
            res.end();
            return;
        }
    }

    files.forEach((item)=>{
        let fpath = join(filePath, item);
        let stat = fs.statSync(fpath);
        let file = {};
        if (stat.isFile() === true) {
            file.name = path.basename(fpath);
            file.size = stat.size;
            file.createTime = stat.birthtime;
            count++;
            fileInfo.push(file);
        }
    });


    fileInfo = {
        belongTOuser: userDir,
        fileInfo : fileInfo,
        status : 'OK'
    };
    if(getAll){
        fileInfo.count = count;
    }
    fileInfo = JSON.stringify(fileInfo);
    res.send(fileInfo);
    res.end();
});
// 上传文件
router.post('/upload', function (req, res, next) {
    let filePath = global.Data.filePath;
    let userDir = req.session.user.uid;
    /* 生成multiparty对象，并配置上传目标路径 */
    let form = new multiparty.Form();
    /* 设置编辑 */
    form.encoding = 'utf-8';
    //设置文件存储路劲
    form.uploadDir = filePath + userDir + '/';

    //设置文件大小限制
    // form.maxFilesSize = 1 * 1024 * 1024;
    form.parse(req, function (err, fields, files) {
        try {
            for(let i=0; i<files.file.length; i++) {
                let inputFile = files.file[i];
                console.log(files.file[i]);
                let newPath = form.uploadDir + inputFile.originalFilename;
                fs.renameSync(inputFile.path, newPath);
            }
            res.send({ status: 'OK',
// eslint-disable-next-line sort-keys
error_msg: '上传成功！' });
        } catch (err) {
            console.log(err);
            res.send({ status: 'Fail',
// eslint-disable-next-line sort-keys
error_msg: '上传失败！' });
        }
    });
});
// 下载文件
router.get('/getFile', function (req, res, next) {
    let getParse = querystring.parse(req.url.split('?')[1]);
    let filePath = global.Data.filePath;
	let userDir = req.session.user.uid;
    let fileName = getParse.filename;
    if (fileName) {
        fileName = decodeURI(fileName);
        res.download(filePath + userDir + '/' + fileName, fileName, function (err) {
            if (err) {
                if(err.code === 'ENOENT'){
                    res.status(err.status).send({ Status: 'Fail',
error_msg: '指定文件不存在' });
                }
                if(err.code === 'ECONNABORTED'){
                    console.error('用户连接断开.暂停,放弃下载或网络终端.');
                }
            }
        });
    } else {
        res.send({ Status: 'Fail',
error_msg: '文件名为空！' });
    }
});
// 删除文件
router.post('/del', function (req, res, next) {
    let filePath = global.Data.filePath;
	let userDir = req.session.user.uid;
    let fileName = req.body.filename;
    filePath += userDir + '/';
    if(fileName.indexOf('/')!==-1 || fileName.indexOf('\\')!==-1){
		res.send({ status: 'Fail', error_msg: '文件名不合法！'});
		return;
    }
    if (fileName) {
        fileName = decodeURI(fileName);
        if(fs.existsSync(filePath + fileName)){
            //读取数据后 删除文件 decodeURI
            fs.unlink(filePath + fileName, function () {
                res.send({ status: 'OK',
error_msg: '删除成功！' });
            });
        }else{
            res.send({ status: 'Fail',
error_msg: '文件不存在！' });
        }
    }else{
        res.send({ status: 'Fail', error_msg: '文件名不能为空！' });
    }
});

router.use((req, res, next) => {
    next(createError(404));
});

router.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    console.error(err.message);
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    let err_data = {
        message: '404_FileNotFind',
        title: '404NotFind',
        errormsg: '文件不存在'
    };
    // render the error page
    res.status(err.status || 500);
    res.render('error', err_data);
});

/**
 * app.use()和router.use()都可以第一个参数为path,
 * 第二个参数可以填一个函数(代表访问到该接口需要干什么)或者一个router
 * @type {Router}
 */

module.exports = router;

// // 下载文件
// router.get('/getFile/:name', function (req, res, next){
//     console.log(global.Data.filePath);
//     let options = {
//         root: global.Data.filePath,
//         dotfiles: 'deny',
//         headers: {
//             'x-timestamp': Date.now(),
//             'x-sent': true
//         }
//     };
//     let fileName = req.params.name;
//     res.sendFile(fileName, options, function (err) {
//         if (err) {
//             next(err);
//         } else {
//             console.log('Sent:', fileName);
//         }
//     });
// });