package controllers

import (
	"fmt"

	"github.com/Lt0/bookshelf/controllers/user"

	"github.com/astaxie/beego"
)

//work for user control
type UserController struct {
	beego.Controller
}

// @Title default user login
// @Description default user login
// @Param passwd formData string true "password of default user, configured in conf/app.conf"
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /login/default [post]
func (c *UserController) LoginDefaultUser() {
	fmt.Println("in default user login")
	handler := &user.DefaultUserLogin{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title default user logout
// @Description default user logout
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /logout/default [get]
func (c *UserController) LogoutDefaultUser() {
	fmt.Println("in default user logout")
	handler := &user.DefaultUserLogout{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title check whether login default user
// @Description check whether login default user
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /islogin/default [get]
func (c *UserController) IsLoginDefaultUser() {
	fmt.Println("in default user is login")
	handler := &user.DefaultUserIsLogin{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}

// @Title get disk info
// @Description get disk info(only for default user)
// @Success 200 {object} models.Object
// @Failure 403 :objectId is empty
// @router /device/disk [get]
func (c *UserController) DeviceDiskInfo() {
	fmt.Println("get device info: disk")
	handler := &user.DefaultUserDiskInfo{Controller: &c.Controller}
	c.Data["json"] = handler.Do()
	c.ServeJSON()
}
