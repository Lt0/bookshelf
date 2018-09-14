package controllers

import (
	"fmt"

	"github.com/Lt0/bookshelf/controllers/booksmgmt"

	"github.com/astaxie/beego"
)

//work for books manager
type BooksMgmtController struct {
	beego.Controller
}

// check file/dir whether exist
// @Title check file/dir whether exist
// @Description check file/dir whether exist
// @Param path query string	true "full path to check"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /isExist [get]
func (c *BooksMgmtController) IsExist() {
	fmt.Println("in books manager: isExist")
	handler := &booksmgmt.BooksMgmtIsExist{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// download a book to server directly
// @Title add a book
// @Description add a book, download a book to server directly
// @Param path query string	true "path to save book"
// @Param BUrl query string true "book url to download or link"
// @Param BName query string false "book name"
// @Param BType query string false "book type, normal/link/webBook, default is normal"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /add [post]
func (c *BooksMgmtController) Add() {
	fmt.Println("in books manager: add")
	handler := &booksmgmt.BooksMgmtAdd{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// upload a book
// @Title upload a book
// @Description upload a book
// @Param path query string	true "path to save file"
// @Param override query string	false "override target file if it's exist? true/false, default is false"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /upload [post]
func (c *BooksMgmtController) Upload() {
	fmt.Println("in books manager: upload")
	handler := &booksmgmt.BooksMgmtUpload{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// remove a book or directory
// @Title remove a book or directory
// @Description remove a book or directory
// @Param path query string	true "removing path"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /delete [get]
func (c *BooksMgmtController) Remove() {
	fmt.Println("in books manager: remove")
	handler := &booksmgmt.BooksMgmtRemove{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// rename a book or directory
// @Title rename a book or directory
// @Description rename a book or directory
// @Param oldPath query string	true "old path, relative path of root book"
// @Param newPath query string	true "new path, relative path of root book"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /rename [get]
func (c *BooksMgmtController) Rename() {
	fmt.Println("in books manager: Rename")
	handler := &booksmgmt.BooksMgmtRename{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// copy a book or directory
// @Title copy a book or directory
// @Description copy a book or directory
// @Param oldPath query string	true "old path, relative path of root book"
// @Param newPath query string	true "new path, relative path of root book"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /copy [get]
func (c *BooksMgmtController) Copy() {
	fmt.Println("in books manager: Copy")
	handler := &booksmgmt.BooksMgmtCopy{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// create a new directory
// @Title create a new directory
// @Description create a new directory
// @Param path query string	true "relative path of root book to create"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /newdir [get]
func (c *BooksMgmtController) NewDir() {
	fmt.Println("in books manager: NewDir")
	handler := &booksmgmt.BooksMgmtNewDir{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}
