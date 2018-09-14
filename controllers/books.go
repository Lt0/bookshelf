package controllers

import (
	"fmt"

	"github.com/Lt0/bookshelf/controllers/books"

	"github.com/astaxie/beego"
)

//work for books
type BooksController struct {
	beego.Controller
}

// return all books and directories
// @Title get books catalog
// @Description get all catalog of books and dirs
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /getBooksCatalog [get]
func (c *BooksController) GetBooksCatalog() {
	fmt.Println("in books: get books catalog")
	handler := &books.GetBooksCatalog{}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// return all books and directories in a specified path
// @Title get books catalog in a specified path
// @Description get catalog of books and dirs in a specified path
// @Param	path		query 	string	true		"relative path of books"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /getBooksDirCatalog [post]
func (c *BooksController) GetBooksDirCatalog() {
	fmt.Println("get files in a dir")
	handler := &books.GetBooksDirCatalog{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title search book from all books
// @Description search book from all books
// @Param	pattern		query 	string	true		"pattern of book's name"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /searchBook [get]
func (c *BooksController) SearchBook() {
	fmt.Println("search book from all books")
	handler := &books.SearchBook{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title search book from specified directory
// @Description search book from specified directory
// @Param path query string true "path to search, it's a relative path of book root"
// @Param pattern query string true "pattern of book's name"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /searchBookDir [get]
func (c *BooksController) SearchBookDir() {
	fmt.Println("search book from specified dir")
	handler := &books.SearchBookDir{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title books space
// @Description get used disk space by path
// @Param path query string true "path to get"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /booksSpace [get]
func (c *BooksController) BooksSpace() {
	fmt.Println("get used disk space by path")
	handler := &books.BooksSpace{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title books num
// @Description get books num
// @Param path query string true "path to cal"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /booksNum [get]
func (c *BooksController) BooksNum() {
	fmt.Println("get books num")
	handler := &books.GetBooksNum{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}
