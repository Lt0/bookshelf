package main

import (
	"path/filepath"

	_ "github.com/Lt0/bookshelf/routers"

	"github.com/Lt0/bookshelf/controllers/books"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
)

func main() {
	//beego.BConfig.WebConfig.StaticDir["/swagger"] = "swagger"
	beego.BConfig.WebConfig.DirectoryIndex = true
	beego.BConfig.WebConfig.StaticDir["/books"] = "books"
	beego.BConfig.WebConfig.StaticDir["/.well-known"] = ".well-known"
	beego.BConfig.WebConfig.StaticDir["/cache"] = "cache"
	if beego.BConfig.RunMode == "dev" {
		//beego.BConfig.WebConfig.DirectoryIndex = true
		beego.BConfig.WebConfig.StaticDir["/swagger"] = "swagger"
	}

	//set books configuration
	books.BooksConf.CacheRoot = "cache"
	books.BooksConf.BookRoot = "books"
	books.BooksConf.CacheBookRoot = filepath.Join(books.BooksConf.CacheRoot, books.BooksConf.BookRoot)

	//add default user filter
	var FilterUser = func(ctx *context.Context) {
		_, ok := ctx.Input.Session(beego.AppConfig.String("defaultUser")).(int)
		if !ok && ctx.Request.RequestURI != "/api/user/login/default" {
			ctx.WriteString("no login, no BB")
		}
	}
	beego.InsertFilter("/api/booksMgmt/*", beego.BeforeRouter, FilterUser)

	beego.Run()
}
