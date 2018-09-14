package user

import (
	"github.com/astaxie/beego"
)

type DefaultUserIsLogin struct {
	Controller *beego.Controller

	IsLogin bool
}

func (p *DefaultUserIsLogin) Do() interface{} {
	v := p.Controller.GetSession(beego.AppConfig.String("defaultUser"))
	if v == nil {
		p.IsLogin = false
	} else {
		p.IsLogin = true
	}
	return p.IsLogin
}
