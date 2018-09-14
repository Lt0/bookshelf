# 说明
当前使用的 txt 阅读器为：https://github.com/Lt0/txt-web.git

## 路径
- 小说路径：默认读取文件的文件路径为 /static/cache/books/
- 字体路径：txt 阅读器使用自带的字体，路径为 /static/fonts/*.woff2，部署时需要将其字体手动复制到当前项目的该位置

# 整合
## 获取项目
在非 /root 目录下，执行
```
git clone https://github.com/Lt0/txt-web.git
cd txt-web
npm install
```

## 修改配置
修改 txt reader 项目中的 config/index.js 文件中的 assetsPublicPath 选项，从 
```
assetsPublicPath: '/',
```

修改为
```
assetsPublicPath: '/static/reader/txt/',
```

## 编译

```
npm run build
```

## 复制
将编译生成的 dist 目录复制到 bookshelf 项目中的 /static/reader/txt/ 目录内

