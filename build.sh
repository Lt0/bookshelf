#!/bin/bash

IMG=lightimehpq/bookshelf

download_fonts() {
  fonts="dongqingheiti.woff2 \
	 fangzhengfangsongjianti.woff2 \
	 fangzhengheijianti.woff2 \
	 fangzhengshusongjianti.woff2 \
	 huakangshaonv.woff2 \
	 pingfangchangguijianti.woff2 \
	 pingfangjixijianti.woff2 \
	 qiheixiuchang.woff2 \
	 qingningyouyuan.woff2 \
	 siyuanheiti-Bold.woff2 \
	 siyuanheiti-Regular.woff2 \
	 siyuanheiti-Thin.woff2 \
	 wenquanweimihei.woff2 \
	 wenquanzhenghei.woff2 \
	 xiliangshaonv.woff2 \
	 zikutanghuangkaiti.woff2"
  dir="static/fonts"
  mkdir -p $dir
  for f in $fonts; do
    wget -O ${dir}/${f} -c https://raw.githubusercontent.com/Lt0/txt-web/master/static/fonts/${f}
  done

}

#download_fonts
docker build -t $IMG .
