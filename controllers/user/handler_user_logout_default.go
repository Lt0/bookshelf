package user

import (
	"fmt"

	"github.com/astaxie/beego"
)

type DefaultUserLogout struct {
	Controller *beego.Controller

	DefaultUser string
	Session     interface{}
}

func (p *DefaultUserLogout) Do() interface{} {
	p.logout()
	return p.Session
}

func (p *DefaultUserLogout) logout() {
	p.DefaultUser = beego.AppConfig.String("defaultUser")

	p.Session = p.Controller.GetSession(p.DefaultUser)

	p.Controller.DelSession(p.DefaultUser)

	fmt.Println("default user logout")
}
