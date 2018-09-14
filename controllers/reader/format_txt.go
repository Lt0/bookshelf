package reader

import (
	"encoding/json"
	//"bytes"
	"fmt"
	"log"
	"os"
	"os/exec"
	//"path"
	"path/filepath"
	"regexp"
	"strings"
	//"time"
	"unicode/utf8"

	"github.com/Lt0/bookshelf/controllers/books"

	"github.com/astaxie/beego"
)

type SplitTxt struct {
	Controller *beego.Controller

	iPath         string
	oPath         string
	clearFilePath string

	bookInfo txtInfo

	content string //file content
	len     int    //length read from file
	size    int64

	catalog []string

	err    error
	retMsg string
}

func (p *SplitTxt) Do() interface{} {
	p.getParam()
	p.checkSrcFile()
	p.ClearOutputPath()
	p.checkOutputPath()
	p.clearInvisibleLine()
	p.ReadFile()
	p.splitFile()
	p.writeCatalog()
	p.writeInfo()
	p.writePreview()
	return p.retMsg
}

func (p *SplitTxt) getParam() {
	path := p.Controller.GetString("path")
	p.iPath = filepath.Join(books.BooksConf.BookRoot, path)
	p.oPath = filepath.Join(books.BooksConf.CacheBookRoot, path)
	p.clearFilePath = filepath.Join(p.oPath, "clearFile", filepath.Base(p.iPath))

	fmt.Println("p.iPath:", p.iPath)
	fmt.Println("p.oPath", p.oPath)
	fmt.Println("p.clearFilePath", p.clearFilePath)
}

func (p *SplitTxt) checkSrcFile() {
	if _, err := os.Stat(p.iPath); os.IsNotExist(err) {
		p.retMsg = "File Not exist"
		fmt.Println("File Not exist")
	}
}

func (p *SplitTxt) ClearOutputPath() {
	if p.retMsg != "" {
		return
	}

	os.RemoveAll(p.oPath)
}

func (p *SplitTxt) checkOutputPath() {
	if p.retMsg != "" {
		return
	}

	path := filepath.Dir(p.clearFilePath)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		err = os.MkdirAll(path, 0666)
		if err != nil {
			p.err = err
			//p.retMsg = fmt.Sprintf("%v", err)
			return
		}
	}
}

func (p *SplitTxt) ReadFile() {
	if p.retMsg != "" {
		return
	}

	f, err := os.Open(p.clearFilePath)
	if err != nil {
		log.Println("open file failed", err)
	}

	fileInfo, _ := f.Stat()
	if fileInfo.IsDir() {
		log.Printf("%s is directory, NOT txt\n", p.clearFilePath)
		return
	}

	p.size = fileInfo.Size()
	p.bookInfo.ModTime = fileInfo.ModTime()
	p.bookInfo.Name = fileInfo.Name()

	c := make([]byte, p.size)
	p.len, err = f.Read(c)
	p.content = string(c)
	p.bookInfo.Words = utf8.RuneCountInString(p.content)

	if err != nil {
		log.Println("read failed,", err)
	} else {
		log.Println("read", p.len, "byte(s)")
	}

	if err := f.Close(); err != nil {
		log.Println("close file failed,", err)
	}

	if p.len == 0 {
		fmt.Println("read 0 bytes")
		//p.retMsg = fmt.Sprintf("%v\n", "read 0 bytes")
	}
}

func (p *SplitTxt) clearInvisibleLine() {
	if p.retMsg != "" {
		return
	}

	args := `/bin/sed '/^\s*$/d' "` + p.iPath + `" > "` + p.clearFilePath + `"`
	_, err := exec.Command("sh", "-c", args).Output()
	if err != nil {
		fmt.Println("exec failed:", err)
	}
}

//split file by chapters
func (p *SplitTxt) splitFile() {
	fmt.Println("splitFile: retMsg:", p.retMsg)
	if p.retMsg != "" {
		return
	}

	log.Println("compile regexp...")
	reg := regexp.MustCompile(`(?m:((^.*((第(0|1|2|3|4|5|6|7|8|9|〇|一|二|两|三|仨|四|五|六|七|八|九|十|廿|百|千|万|零|壹|贰|叁|肆|伍|陆|柒|捌|玖|拾|佰|仟|萬|\d)+(章|回|部|卷|节|集)\s.*)))|(^\s*((楔\s*子)|(前\s*言)|(序)).*)|(^\s*后\s*记.*))+$)`)

	log.Println("split chapters...")
	index := 0
	fileTitle := strings.TrimSuffix(filepath.Base(p.iPath), ".txt")
	var loc []int

	p.catalog = append(p.catalog, fileTitle)
	for {
		loc = reg.FindStringIndex(p.content[index : p.len-1])
		if loc == nil {
			//fmt.Println("no match anymore")
			break
		}

		//fmt.Println("chapter: ", len(p.catalog))
		//fmt.Println("index: ", index)
		//fmt.Println("loc: ", loc)
		p.writeChapter(len(p.catalog), p.content[index:index+loc[0]])
		p.catalog = append(p.catalog, p.content[index+loc[0]:index+loc[1]])
		index = index + loc[1]
	}
	// 输出最后一章的内容
	p.writeChapter(len(p.catalog), p.content[index:len(p.content)])
	p.bookInfo.Chapters = len(p.catalog)
}

func (p *SplitTxt) writeChapter(chapterIndex int, content string) {
	if p.retMsg != "" {
		return
	}

	index := fmt.Sprintf("%d", chapterIndex)
	path := filepath.Join(p.oPath, index+".txt")
	writeFile(path, content)
}

func (p *SplitTxt) writeCatalog() {
	if p.retMsg != "" {
		return
	}

	var s string
	for _, v := range p.catalog {
		s += v
		s += "\n"
	}

	path := filepath.Join(p.oPath, "catalog.txt")
	writeFile(path, s)
}

func (p *SplitTxt) writeInfo() {
	if p.retMsg != "" {
		return
	}

	info, err := json.Marshal(p.bookInfo)
	if err != nil {
		fmt.Println("error:", err)
	}
	os.Stdout.Write(info)

	path := filepath.Join(p.oPath, "info.txt")
	writeFile(path, fmt.Sprintf("%s", string(info)))
}

func (p *SplitTxt) writePreview() {
	if p.retMsg != "" {
		return
	}

	path := filepath.Join(p.oPath, "preview.txt")
	writeFile(path, fmt.Sprintf("%s", p.content[:8192]))
}

func writeFile(path, content string) {
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0666)
	if err != nil {
		log.Println(err)
	}
	var n int
	n, err = f.WriteString(content)
	if n != len(content) {
		log.Println("file may be truncted")
	}
	if err = f.Close(); err != nil {
		log.Println(err)
	}
}
