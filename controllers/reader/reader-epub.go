package reader

import (
  "github.com/astaxie/beego"
)

type ReaderEpubHandler struct {
	Control *beego.Controller

  file string;
}

func (p *ReaderEpubHandler) Do() {
	p.Control.TplName = "reader/epub/index.html"
  p.getParam();
  p.setOutput();
}

func (p *ReaderEpubHandler) getParam(){
  p.file = p.Control.GetString("file", "")
}

func (p *ReaderEpubHandler) setOutput(){
  p.Control.Data["file"] = p.file
}
