const _ = require('lodash')
const path = require('path')
const url = require('url')
const crypto = require('crypto')
const sharp = require('sharp')


const PLUGIN_NAME = 'html-webpack-manifest-plugin'

function hexHash(hashContent) {
  const hashObj = crypto.createHash('md5').update(hashContent)
  return hashObj.digest('hex')
}

function extraHashName(hashPath) {
  const m = hashPath.match(/\[(\w+):?(\d*)\]/)
  if (m) {
    return [m[1], m[2]]
  } else {
    return null
  }
}

function genManifest(manifest, compilation, iconFiles) {
  let fileName = manifest.filename
  const filePath = manifest.filePath

  const manifestContent = manifest.config
  if (iconFiles) {
    manifestContent.icons = iconFiles
  }
  const manifestJson = JSON.stringify(manifestContent)
  // 需要计算hash,直接md5即可
  // 抽取文件名中hash
  const m = fileName.match(/\[(\w+):?(\d*)\]/)
  if (m) {
    const hashType = m[1]
    const hashLength = m[2]
    const hashObj = crypto.createHash('md5').update(manifestJson)
    const fullHash = hashObj.digest('hex')
    console.log('fullHash ==>', fullHash)
    let fileHash = fullHash
    if (hashLength) {
      fileHash = fullHash.substr(0, hashLength)
    }
    fileName = fileName.replace(/\[.*\]/, fileHash)
    console.log('\nfileName ==>', fileName)
  }
  let outputPath = path.resolve(filePath, fileName)
  compilation.assets[outputPath] = {
    source: function () {
      return manifestJson
    },
    size: function () {
      return manifestJson.length
    },
    type: 'manifest'
  }
}

function HtmlWebpackManifestPlugin(options) {
  this.options = _.merge({}, {
    manifest: {
      filename: 'manifest.[hash:8].json',
      filePath: '/static/',
      prefix: '/',
      config: {
        name: 'html webpack manifest plugin',
        short_name: 'manifest',
        start_url: '/?homescreen=1',
        display: "standalone",
        background_color: '#fff',
        description: null,
        icons: [],
        lang: 'en-US',
        orientation: 'portrait',
        scope: '/',
        theme_color: '#fff'
      }
    }
  }, options)
  console.log(this.options)
  this.beforeV4 = false
}


HtmlWebpackManifestPlugin.prototype.apply = function (compiler) {
  this.beforeV4 = !compiler.hooks
  const that = this
  if (!this.beforeV4) {

    compiler.hooks['compilation'].tap(PLUGIN_NAME, function (compilation) {
      compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration
        .tapAsync(PLUGIN_NAME, function (htmlPluginData, cb) {
          // 生成一个manifest
          const manifest = that.options.manifest
          console.log('manifest =>', manifest)
          if (manifest) {
            // 生成favicons
            const icons = manifest.icons
            const logoPath = icons.logo

            const promises = [sharp(logoPath).toBuffer()].concat(icons.sizes.map(function (size) {
              return sharp(logoPath).resize(size).toBuffer()
            }))
            Promise.all(promises)
              .then(function (results) {
                const oldResult = results[0]
                const fullHash = hexHash(oldResult)
                const hashArrs = extraHashName(icons.output)
                let output = icons.output
                if (hashArrs) {
                  let fileHash = fullHash
                  if (hashArrs[1]) {
                    fileHash = fullHash.substr(0, hashArrs[1])
                  }
                  output = output.replace(/\[.*\]/, fileHash)
                }

                let iconFiles = []
                results.slice(1).map(function (data, index) {
                  const size = icons.sizes[index]
                  const outputPath = path.resolve(output, `android-chrome-${size}x${size}.png`)
                  const prefix = icons.prefix
                  iconFiles.push({
                    "src": prefix ? url.resolve(prefix, outputPath) : outputPath,
                    "sizes": `${size}x${size}`,
                    "type": icons.type
                  })
                  compilation.assets[outputPath] = {
                    source: function () {
                      return data
                    },
                    size: function () {
                      return data.length
                    },
                    type: 'icon'
                  }
                })

                genManifest(manifest, compilation, iconFiles)

                cb(null, htmlPluginData)
              })
          } else {
            cb(null, htmlPluginData)
          }
        })

      compilation.hooks.htmlWebpackPluginAlterAssetTags
        .tapAsync(PLUGIN_NAME, function (htmlPluginData, cb) {
          // gen link
          const linkGroup = that.options.linkGroup
          if (linkGroup) {
            linkGroup.map(function (group) {
              const groupAttrs = group.attributes
              const attr = group.attr || 'href'
              const groupTags = group.links.map(function (link) {
                let attributes = {}
                if (typeof link === 'string') {
                  attributes[attr] = link
                  attributes = _.merge({}, groupAttrs, attributes)
                } else {
                  attributes = _.merge({}, groupAttrs, link)
                }
                return {
                  tagName: 'link',
                  closeTag: false,
                  attributes: attributes
                }
                return tag
              })
              htmlPluginData.head = htmlPluginData.head.concat(groupTags)
            })
          }

          // inject manifest file
          const assets = compilation.assets
          if (assets) {
            Object.keys(assets)
              .map(function (key) {
                const asset = assets[key]
                if (asset.type === 'manifest') {
                  const prefix = that.options.manifest.prefix
                  const href = prefix ? url.resolve(prefix, key) : key
                  htmlPluginData.head.push({
                    tagName: 'link',
                    closeTag: false,
                    attributes: {
                      rel: asset.type,
                      href: href
                    }
                  })
                }
                // else if (asset.type === 'icon') {
                //   const prefix = that.options.manifest.icons.prefix
                //   const href = prefix ? url.resolve(prefix, key) : key
                //   htmlPluginData.head.push({
                //     tagName: 'link',
                //     closeTag: false,
                //     attributes: {
                //       rel: asset.type,
                //       href: href
                //     }
                //   })
                // }
              })
          }
          cb(null, htmlPluginData)
        })
    })

    // compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, function (compilation) {
    //   console.log('afterEmit compilation ==>', compilation.assets)
    // })
  }
}


module.exports = HtmlWebpackManifestPlugin
