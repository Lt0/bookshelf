package controllers

import (
	"fmt"

	"github.com/Lt0/bookshelf/controllers/reader"
	"github.com/astaxie/beego"
)

// Work for reader
type ReaderController struct {
	beego.Controller
}

// @Title read txt file
// @Param	 file		query 	string	true		"txt file to be opened"
// @Description read a single txt file
// @Success 200 {object} {Error:string}
// @router /open [get]
func (c *ReaderController) Open() {
	fmt.Println("in open")
	handler := &reader.ReadTxtHandle{Control: &c.Controller}
	handler.Do()
}

// @Title epub reader
// @Param	 file		query 	string	true		"epub file to be opened"
// @Description open an epub file
// @Success 200 {object} {Error:string}
// @router /epub [get]
func (c *ReaderController) Epub() {
	fmt.Println("in reader epub")
	handler := &reader.ReaderEpubHandler{Control: &c.Controller}
	handler.Do()
}

// @Title Format book
// @Param path query string true "format file to cache"
// @Description format file to cache as book
// @Success 200 {object} {Error:string}
// @router /format [get]
func (c *ReaderController) Format() {
	fmt.Println("in format")
	handler := &reader.FormatBook{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title TXT reader save user config
// @Description save user config(used by TXT reader)
// @Success 200 {object} {Error:string}
// @router /txt/user/conf [post]
func (c *ReaderController) TxtConfSaver() {
	fmt.Println("in TxtConfSave")
	handler := &reader.TxtConfSaver{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title TXT reader save user bookmarks
// @Description save user bookmarks(used by TXT reader)
// @Param file query string true "bookmarks' file"
// @Success 200 {object} {Error:string}
// @router /txt/user/bookmarks [post]
func (c *ReaderController) TxtBookMarksSaver() {
	fmt.Println("in TxtBookMarksSaver")
	handler := &reader.TxtBookMarksSaver{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}