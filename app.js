var express = require('express');  // 加载express模块
var app = express(); // 启动Web服务器

var port = process.env.PORT || 3000; // 设置端口号：3000
app.listen(port); // 监听 port[3000]端口
console.log('i_movie start on port' + port);

var path = require('path');
// 引入path模块的作用：因为页面样式的路径放在了bower_components，告诉express，请求页面里所过来的请求中，如果有请求样式或脚本，都让他们去bower_components中去查找

var mongoose = require('mongoose'); // 加载mongoose模块
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/imovie'); // 连接mongodb本地数据库imovie
console.log('MongoDB connection success!');
/*  mongoose 简要知识点补充
* mongoose模块构建在mongodb之上，提供了Schema[模式]、Model[模型]和Document[文档]对象，用起来更为方便。
* Schema对象定义文档的结构（类似表结构），可以定义字段和类型、唯一性、索引和验证。
* Model对象表示集合中的所有文档。
* Document对象作为集合中的单个文档的表示。
* mongoose还有Query和Aggregate对象，Query实现查询，Aggregate实现聚合。
* */

app.locals.moment = require('moment'); // 载入moment模块，格式化日期

var serveStatic = require('serve-static');  // 静态文件处理
app.use(serveStatic('public')); // 路径：public

var bodyParser = require('body-parser');
// 因为后台录入页有提交表单的步骤，故加载此模块方法（bodyParser模块来做文件解析），将表单里的数据进行格式化
// 返回的对象是一个键值对，当extended为false的时候，键值对中的值就为'String'或'Array'形式，为true的时候，则可为任何数据类型。
app.use(bodyParser.urlencoded({extended: true}));

var _underscore = require('underscore'); // _.extend用新对象里的字段替换老的字段

app.set('views', './views/pages');     // 设置视图默认的文件路径
app.set('view engine', 'jade');  // 设置视图引擎：jade

var Movie = require('./models/movie.js'); // 载入mongoose编译后的模型movie

// 编写主要页面路由
// index page 首页
app.get('/', function (req, res) {
    // 他们的定义在schemas那里，将fetch的find({})返回的文档数组定义为movies
    Movie.fetch(function (err, movies) {
        if (err) {
            console.log(err);
        }
        res.render('index', {  // 渲染index 首页,index.jade
            title: 'i_movie 首页',
            movies: movies
        });
    });
});

// detail page 详情页
app.get('/movie/:id', function (req, res) {
    // :id其实就是url串的匹配，匹配到的内容送到req.params那里
    var id = req.params.id;
    Movie.findById(id, function (err, movie) {
        res.render('detail', {
            title: 'i_movie' + movie.title,
            movie: movie
        });
    });
});

// admin page 后台录入页
app.get('/admin/movie', function (req, res) {
    res.render('admin', {
        title: 'i_movie 后台录入页',
        movie: {
            title: '',
            doctor: '',
            country: '',
            year: '',
            poster: '',
            flash: '',
            summary: '',
            language: ''
        }
    });
});

// admin update movie 后台更新页，将数据更新到表单中
app.get('/admin/update/:id', function (req, res) {
    var id = req.params.id;
    if (id) {
        Movie.findById(id, function (err, movie) {
            res.render('admin', {
                title: 'imovie 后台更新页',
                movie: movie
            });
        });
    }
});

// admin post movie 后台录入提交
app.post('/admin/movie/new', function (req, res) {
    // post的数据可能是新加的，也可能是修改过再次post：
    var id = req.body.movie._id;
    var movieObj = req.body.movie;
    var _movie = null;
    if (id !== 'undefined') { // 已经存在的电影数据
        Movie.findById(id, function (err, movie) {
            if (err) {
                console.log(err);
            }
            _movie = _underscore.extend(movie, movieObj); // extend用新对象里的字段替换老的字段，需要在文件头引入underscore模块
            _movie.save(function (err, movie) {
                if (err) {
                    console.log(err);
                }
                res.redirect('/movie/' + movie._id);
            });
        });
    } else {  // 新加的电影
        _movie = new Movie ({
            doctor: movieObj.doctor,
            title: movieObj.title,
            country: movieObj.country,
            language: movieObj.language,
            year: movieObj.year,
            poster: movieObj.poster,
            summary: movieObj.summary,
            flash: movieObj.flash
        });
        _movie.save(function (err, movie) {
            // 参数movie其实应该就是经过save之后的__movie
            if (err) {
                console.log(err);
            }
            res.redirect('/movie/' + movie._id);
        });
    }
});

// list page 列表页
app.get('/admin/list', function (req, res) {
    Movie.fetch(function (err, movies) {
        if (err) {
            console.log(err);
        }
        res.render('list', {
            title: 'i_movie 列表页',
            movies: movies
        });
    });
});

// list delete movie data 列表页删除电影
app.delete('/admin/list', function (req, res) {
    // 从url里面的参数拿到
    var id = req.query.id;
    if (id) {
        Movie.remove({_id: id}, function (err, movie) {
            if (err) {
                console.log(err);
            } else {
                res.json({success: 1});
            }
        });
    }
});
