# html-webpack-manifest-plugin

自动生成一个`manifest`的`html-webpack-plugin`插件

同步将`manifest`文件注入到`html`中，需要配合`html-webpack-plugin`一起使用

插件会同时生成需要尺寸的`favicon`

**目前只支持了 webpack4+，因为 4 以下的钩子没有挂，所以不能用，懒得写了，就这样吧，自己能用就行了**

**这个插件我是在用了好几个自动生成 favicon 的插件之后非常不满意，比如[这个](https://github.com/itgalaxy/favicons),这么多 star，但是连基本的 manifest 需要的字段都能丢了，pr 也不合并，只能自己来了，当然只是满足了我自己需求，其他的不考虑了**

## 使用

没有上传 `npm`，所以直接`github`安装

这个库目前主要依赖了`sharp`和`lodash`两个库，依赖没有装成功就手动安装咯...我搞不清这些东西怎么自动安装的，垃圾`npm`

```js
module.exports = {
    ...
    plugins: [
        new HtmlWebpackPlugin(),
        new HtmlWebpackManifestPlugin({
            manifest: {
                // manifest文件名称，带有 [hash:8]可以指定hash值和hash长度
                filename: 'manifest.[hash:8].json',
                // manifest文件的位置
                filePath: '/static/',
                // manifest文件前缀，主要还是自动添加cdn之类的作用
                prefix: 'https://cdn.com/'
                // manifest文件中的icon,指定图标的位置，大小尺寸之后会自动生成对应的图标
                icons: {
                    // 图标位置
                    logo: path.resolve(__dirname, './static/logo.png'),
                    // 图标尺寸，都是1:1的图
                    sizes: [36, 48, 72],
                    // 图标类型
                    type: 'image/png',
                    // 输出文件的URL
                    output: '/static/icons-[hash:8]/',
                    // 增加文件前缀，可以添加cdn地址
                    prefix: '/'
                }
                config: {
                    // 这里可以接受manifest文件中需要的任何参数，也就是你填什么在这，生成的manifest文件中就有什么
                    name: 'html webpack manifest plugin',
                    short_name: 'manifest',
                    ...
                }
            },
            // 这里主要配置生成head中的一些链接，按照规则自动生成并inject
            head: {
                meta: [{
                        charset: 'utf-8'
                    },
                    {
                        name: 'viewport',
                        content: 'width=device-width, initial-scale=1'
                    },
                    {
                        hid: 'description',
                        name: 'description',
                        content: 'Meta description'
                    }
                ],
                link: [{
                    rel: 'dns-prefetch',
                    href: 'https://d15lz63ykon5oa.cloudfront.net'
                }, {
                    rel: 'dns-prefetch',
                    href: 'https://d14rk0dlif47fw.cloudfront.net'
                }, {
                    rel: 'preconnect',
                    href: 'https://d1n1fwner8zc14.cloudfront.net/'
                }]
            }
        })
    ]
}
```
