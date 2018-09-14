// @APIVersion 1.0.0
// @Title mobile API
// @Description mobile has every tool to get any job done, so codename for the new mobile APIs.
// @Contact lightimehpq@gmail.com
package routers

import (
	"github.com/Lt0/bookshelf/controllers"

	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/", &controllers.MainController{})

	ns1 := beego.NewNamespace("/api",
		beego.NSNamespace("/reader",
			beego.NSInclude(
				&controllers.ReaderController{},
			),
		),
		beego.NSNamespace("/books",
			beego.NSInclude(
				&controllers.BooksController{},
			),
		),
		beego.NSNamespace("/user",
			beego.NSInclude(
				&controllers.UserController{},
			),
		),
		beego.NSNamespace("/booksMgmt",
			beego.NSInclude(
				&controllers.BooksMgmtController{},
			),
		),
	)

	beego.AddNamespace(ns1)
}
