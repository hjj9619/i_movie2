var mongoose = require('mongoose')
var movieSchema = require('../schemas/movie.js') // 引入'../schemas/movie.js'导出的模式，听说这里可以不用加.js

// 编译生成movie模型
var Movie = mongoose.model('Movie', movieSchema)

// 将movie模型[构造函数]导出
module.exports = Movie
