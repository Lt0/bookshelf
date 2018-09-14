package controllers

import (
	"github.com/Lt0/bookshelf/controllers/books"
	"fmt"

	"github.com/astaxie/beego"
)

type MainController struct {
	beego.Controller
}

// @Title index.tpl
// @Description get all objects
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router / [get]
func (c *MainController) Get() {
	fmt.Println("in main")
	handler := &books.BShelfHandle{Control: &c.Controller}
	handler.Do()
}
