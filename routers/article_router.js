var express = require('express')
const Joi = require('@hapi/joi')
const Sequelize = require('sequelize')
const Op = Sequelize.Op;
var router = express.Router()
var Article = require('../models/Article')
var Article_type = require('../models/Article_type')
var Tag = require('../models/Tag')
var Type = require('../models/Type')
var Comment = require('../models/Comment')
var User_article = require('../models/User_article')
var User = require('../models/User')
var Star = require('../models/Star')
var authJwt = require('../lib/authJwt');
const userInfo = require('../lib/userInfo')

// 判断权限
// router.use((req, res, next) => {
//     console.log('判断权限');
//     const validateList = ['/add', '/del', '/edit']
//     console.log(validateList.indexOf(req.path.toLowerCase()));
//     if (validateList.indexOf(req.path.toLowerCase()) != -1) {
//         const jwt_res = authJwt(req)
//         console.log(jwt_res);
//         jwt_res.code == 401 ? next(jwt_res) : next()
//         // 不加return会继续执行if语句外面的代码
//         return
//     } else {
//         next()
//     }
//     // console.log('没想到吧，我还会执行');
// })

// 判断参数
// const validateArticle = Joi.object({
//     id: [
//         null,
//         Joi.number()
//     ],
//     title: Joi.string()
//         .min(3)
//         .max(20)
//         .required(),
//     type: Joi.string()
//         .min(2)
//         .max(5)
//         .required(),
//     img: [
//         null,
//         Joi.string().min(3).max(100),
//     ],
//     content: Joi.string().min(3).required(),
//     date: Joi.string().max(20).required(),
//     click: Joi.number(),
//     tagList: Joi.array().required()
// }).xor('img').xor('id')


//文章列表
router.get('/', async function (req, res, next) {
    var { ordername, orderby } = req.query
    if (ordername && orderby) {
        var ordername = ordername.replace(/\'/g, "")
        var orderby = orderby.replace(/\'/g, "")
        var list = await Article.findAndCountAll(
            {
                order: [
                    [
                        ordername,
                        orderby
                    ]
                ]
            }
        )
    } else {
        var list = await Article.findAndCountAll()
    }

    res.json({
        list
    })
})

//文章类型列表
router.get('/typelist', async function (req, res, next) {
    var typelist = await Article.findAll({
        attributes: ['type'],
        group: 'type'
    })
    res.json({
        typelist
    })
})

// 随记文章分页
router.get('/page1', async function (req, res, next) {
    var { is_admin, ordername, orderby, nowPage, pageSize } = req.query
    console.log(ordername, orderby, nowPage, pageSize, is_admin)
    var offset = parseInt((nowPage - 1) * pageSize)
    var limit = parseInt(pageSize)
    if (is_admin) {
        var { count, rows } = await Article.findAndCountAll({
            order: [
                [ordername ? ordername : 'createdAt', orderby ? orderby : 'desc']
            ],
            limit: limit,
            offset: offset,
            include: [
                {
                    model: Star,
                    where: {
                        to_user_id: -1
                    },
                    required: false,
                },
                {
                    model: User,
                },
                {
                    model: Comment,
                },
                {
                    model: Tag,
                    through: { attributes: [] },
                },
            ],
            distinct: true,
        })
        return res.status(200).json({ code: 200, count, rows, message: '获取随记文章分页成功！' })
    }
})

// 获取文章列表
router.get('/page', async function (req, res, next) {
    var { is_admin, ordername, orderby, type_id, keyword, status, is_comment, nowPage, pageSize } = req.query
    console.log(is_admin, ordername, orderby, type_id, nowPage, pageSize)
    var offset = parseInt((nowPage - 1) * pageSize)
    var limit = parseInt(pageSize)
    let whereData = {}
    let whereData1 = {}
    let search = [
        {
            title: {
                [Op.like]: '%' + "" + '%'
            }
        },
        {
            content: {
                [Op.like]: '%' + "" + '%'
            }
        }
    ]
    let orderData = []
    if (type_id != undefined) {
        whereData1['id'] = type_id
    }
    if (keyword != undefined) {
        search = [
            {
                title: {
                    [Op.like]: '%' + keyword + '%'
                }
            },
            {
                content: {
                    [Op.like]: '%' + keyword + '%'
                }
            }
        ]
    }
    if (status != undefined) {
        whereData['status'] = status
    }
    if (is_comment != undefined) {
        whereData['is_comment'] = is_comment
    }
    if (ordername && orderby) {
        orderData.push([
            ordername, orderby
        ])
    }
    if (is_admin) {
        var { count, rows } = await Article.findAndCountAll({
            where: {
                ...whereData,
                [Op.or]: search
            },
            // where: {
            //     [Op.or]: search

            // },
            order: orderData,
            limit: limit,
            offset: offset,
            // include: [
            // {
            // model: Article,
            // where: whereData1,
            include: [
                {
                    model: Type,
                    // as:'xxx',
                    where: whereData1,
                },
                {
                    model: Star,
                    where: {
                        to_user_id: -1
                    },
                    required: false,
                },
                {
                    model: User,
                },
                {
                    model: Comment,
                },
                {
                    model: Tag,
                    through: { attributes: [] },
                },
            ],
            required: false,
            // },
            // ],
            distinct: true,
        })
        return res.status(200).json({ whereData, search, whereData1, code: 200, count, rows, message: '获取文章列表成功！' })

    }
})

// //文章分页
// router.get('/page', async function (req, res, next) {
//     var { ordername, orderby, type, nowPage, pageSize, is_admin } = req.query
//     console.log(ordername, orderby, type, nowPage, pageSize, is_admin)
//     var offset = parseInt((nowPage - 1) * pageSize)
//     var limit = parseInt(pageSize)
//     if (is_admin) {
//         var pagelist = await Article.findAndCountAll({
//             // order: [['createdAt', 'desc']],
//             limit: limit,
//             offset: offset,
//             include: [
//                 {
//                     model: Star,
//                     where: {
//                         to_user_id: -1
//                     },
//                     required: false,
//                 },
//                 {
//                     model: User,
//                 },
//                 {
//                     model: Comment,
//                 },
//                 {
//                     model: Tag,
//                     through: { attributes: [] },
//                 },
//             ],
//             distinct: true,
//         })
//         res.status(200).json({
//             pagelist
//         })
//         return
//     }
//     if (type) {
//         var pagelist = await Article.findAndCountAll({
//             where: { type, status: 1 },
//             order: [['createdAt', 'desc']],
//             limit: limit,
//             offset: offset,
//             include: [
//                 {
//                     model: User,
//                 },
//                 {
//                     model: Comment,
//                 },
//                 {
//                     model: Tag,
//                     through: { attributes: [] },
//                 },
//                 {
//                     model: Star,
//                 },
//             ],
//             // 去重
//             distinct: true,
//         })
//     }
//     if (ordername && orderby) {
//         var ordername = ordername.replace(/\'/g, "")
//         var orderby = orderby.replace(/\'/g, "")
//         var pagelist = await Article.findAndCountAll({
//             where: { status: 1 },
//             order: [[ordername, orderby]],
//             limit: limit,
//             offset: offset,
//             include: [
//                 {
//                     model: User,
//                 }, {
//                     model: Comment,
//                 }],
//             // 去重
//             distinct: true,
//         })
//     }
//     if (type == undefined && ordername == undefined && orderby == undefined) {
//         var pagelist = await Article.findAndCountAll({
//             order: [['createdAt', 'desc']],
//             where: { status: 1 },
//             limit: limit,
//             offset: offset,
//             include: [
//                 {
//                     model: User,
//                 },
//                 {
//                     model: Star,
//                     where: {
//                         to_user_id: -1
//                     },
//                     required: false,
//                 },
//                 {
//                     model: Comment,
//                 },
//                 {
//                     model: Tag,
//                     through: { attributes: [] },
//                 },
//             ],
//             distinct: true,
//         })
//     }
//     res.status(200).json({
//         pagelist
//     })
// })

// 发表文章
router.post('/add', async function (req, res, next) {
    // try {
    //     await validateArticle.validateAsync(req.body, { convert: false })
    // } catch (err) {
    //     next({ code: 400, message: err.message })
    //     return
    // }
    const { title, type, img, is_comment, status, content, click, tags } = req.body
    const jwt_res = authJwt(req)
    // if (jwt_res.user.role == 'admin') {
    let aaa = await Article.create({
        title, type, img, is_comment, status, content, click
    })
    // let bbb = await Tag.findAll({ where: { id: tagList } })
    let ccc = aaa.setTags(tags)
    res.status(200).json({ code: 200, ccc, message: '发表文章成功！' })

    // } else {
    // next(jwt_res)
    // return
    // }

})

// 删除文章
router.delete('/del', async function (req, res, next) {
    try {
        await Joi.number().required().validateAsync(req.body.id, { convert: false })
    } catch (err) {
        next({ code: 400, message: err.message })
        return
    }
    const jwt_res = authJwt(req)
    if (jwt_res.user.role == 'admin') {
        let find_article = await Article.findByPk(req.body.id)
        let delelte_tag = await find_article.setTags([])
        let delelte_article = await find_article.destroy()
        res.status(200).json({ code: 1, delelte_article })
    } else {
        next(jwt_res)
        return
    }
})

//查找文章
router.get('/find', async function (req, res) {
    var { id, title } = req.query
    var currentId = userInfo.id || -2
    // 查询某篇文章，点击量+1
    if (id) {
        var list = await Article.findAndCountAll({
            where: {
                id
            },
            include: [
                {
                    model: Tag,
                    through: { attributes: [] },
                },
                {
                    where: {
                        to_user_id: -1
                    },
                    /* 
                        sequelize默认是左外连接，如果你有条件，它会给你变成内连接
                        。这么做是有道理的，因为情况只返回内外条件都满足的数据。
                        为了能够保持外连接，需要用到required属性， 只需要把写上required: false属性即可。
                    */
                    //不加：required:fasld：INNER JOIN `star` AS `stars` ON `article`.`id` = `stars`.`article_id` AND `stars`.`to_user_id` = - 1
                    //加：required:fasld： LEFT OUTER JOIN `star` AS `stars` ON `article`.`id` = `stars`.`article_id` AND `stars`.`to_user_id` = - 1
                    required: false,
                    model: Star,

                },
            ],

        })

        var newlist = []
        for (let i = 0; i < list.rows.length; i++) {
            var temp = list.rows[i].get({
                plain: true,
            })
            temp.isStar = false
            if (temp.stars.length) {
                temp.stars.forEach(item => {
                    if (item.from_user_id == currentId) {
                        temp.isStar = true
                    }
                })
            }
            newlist.push(temp)
        }
        list.rows = newlist

        Article.update(
            {
                click: Sequelize.literal('`click` +1')
            },
            {
                where: { id },
                // silent如果为true，则不会更新updateAt时间戳。
                silent: true
            })
    } else {
        // 模糊查询
        var list = await Article.findAndCountAll({
            where: {
                [Op.or]: [
                    {
                        title: {
                            [Op.like]: '%' + title + '%'
                        }
                    },
                    {
                        content: {
                            [Op.like]: '%' + title + '%'
                        }
                    }
                ]
            }

        })
    }
    res.json({ list })

})

console.log('test')
// 修改文章
router.put('/edit', async function (req, res, next) {
    // try {
    //     await validateArticle.validateAsync(req.body, { convert: false })
    // } catch (err) {
    //     next({ code: 400, message: err.message })
    //     return
    // }
    const { id, title, type, img, is_comment, status, content, click, tags } = req.body
    // const newtags = []
    // tags.forEach((item) => {
    //     newtags.push(item.id)
    // })
    // const jwt_res = authJwt(req)
    // if (jwt_res.user.role == 'admin') {
    // let update_tags = await Tag.findAll({ where: { id: newtags } })
    let find_article = await Article.findByPk(id)
    let update_article = await find_article.update({ title, type, img, is_comment, status, content, click })
    let update_article_result = await find_article.setTags(tags)
    res.status(200).json({ code: 200, update_article_result, message: '修改文章成功！' })
    // } else {
    //     next(jwt_res)
    //     return
    // }

})

module.exports = router