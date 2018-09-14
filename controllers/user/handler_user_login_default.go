package user

import (
	"fmt"

	"github.com/astaxie/beego"
)

type DefaultUserLogin struct {
	Controller *beego.Controller

	DefaultUser   string
	passwd        string
	defaultPasswd string

	Session   interface{}
	SessionID interface{}
}

func (p *DefaultUserLogin) Do() interface{} {
	p.set()
	p.getPasswd()
	p.getDefaultPasswd()
	p.auth()
	return p.Session
}

func (p *DefaultUserLogin) set() {
	p.DefaultUser = beego.AppConfig.String("defaultUser")
	p.SessionID = nil
}

func (p *DefaultUserLogin) getPasswd() {
	p.passwd = p.Controller.GetString("passwd")
	fmt.Println("passwd:", p.passwd)
}

func (p *DefaultUserLogin) getDefaultPasswd() {
	p.defaultPasswd = beego.AppConfig.String("defaultPasswd")
	fmt.Println("defaultPasswd:", p.defaultPasswd)
}

func (p *DefaultUserLogin) auth() {
	if p.passwd != p.defaultPasswd {
		return
	}

	v := p.Controller.GetSession(p.DefaultUser)
	if v == nil {
		p.Controller.SetSession(p.DefaultUser, int(1))
	} else {
		p.Controller.SetSession(p.DefaultUser, v.(int)+1)
	}

	//p.SessionID = p.Controller.CruSession.SessionID()
	p.Session = p.Controller.GetSession(p.DefaultUser)
}
