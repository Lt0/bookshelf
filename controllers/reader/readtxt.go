package reader

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/Lt0/bookshelf/controllers/books"

	"github.com/astaxie/beego"
)

type ReadTxtHandle struct {
	Control *beego.Controller

	file string
	path string
	size int64 //file size

	bookInfo txtInfo

	content string //file content
	len     int    //length read from file

	chapters []string //chapters title
	fmtBook  bytes.Buffer

	err error
}

func (p *ReadTxtHandle) Do() {
	p.Control.TplName = "readtxt.html"
	p.ReadFile()
	p.fmtFile()
	p.ShowFileInfo()
	p.showChapter()
	p.showBook()
	p.genDownLink()
}

func (p *ReadTxtHandle) ShowFileInfo() {
	p.Control.Data["file"] = p.Control.GetString("file", "")
	p.Control.Data["fileName"] = p.bookInfo.Name
	p.Control.Data["fileSize"] = fmt.Sprintf("%f MB", float32(p.size)/1024/1024)
	p.Control.Data["fileWords"] = p.bookInfo.Words
	p.Control.Data["fileChapter"] = p.bookInfo.Chapters
	p.Control.Data["fileModTime"] = p.bookInfo.ModTime.Format(time.UnixDate)
	p.Control.Data["filePath"] = p.path
}

func (p *ReadTxtHandle) showTitle() {
	p.Control.Data["bookTitle"] = p.file
}

func (p *ReadTxtHandle) showChapter() {
	chapters := fmt.Sprintf("%s", p.chapters)
	p.Control.Data["chapters"] = chapters[1 : len(chapters)-1]
}

func (p *ReadTxtHandle) showBook() {
	p.Control.Data["book"] = p.fmtBook.String()
}

func (p *ReadTxtHandle) genDownLink() {
	p.Control.Data["downloadPath"] = fmt.Sprintf("/books/%s", p.file)
	p.Control.Data["downloadName"] = p.file

}

func (p *ReadTxtHandle) ReadFile() {
	p.file = p.Control.GetString("file", "")
	//p.path = fmt.Sprintf("/vob/golang/src/bookshelf/books/%s", p.file)
	p.path = path.Join(books.BooksConf.BookRoot, p.file)

	f, err := os.Open(p.path)
	if err != nil {
		log.Println("open file failed", err)
	}

	fileInfo, _ := f.Stat()
	if fileInfo.IsDir() {
		log.Printf("%s is directory, NOT txt\n", p.path)
		return
	}

	p.size = fileInfo.Size()
	p.bookInfo.ModTime = fileInfo.ModTime()
	p.bookInfo.Name = fileInfo.Name()
	fmt.Println("size:", p.size)
	fmt.Println("mod:", p.bookInfo.ModTime)
	fmt.Println("name:", p.bookInfo.Name)

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
		log.Println("close file faield,", err)
	}
}

//split file by chapters
func (p *ReadTxtHandle) fmtFile() {
	log.Println("compile regexp...")
	reg := regexp.MustCompile(`(?m:((^.*((第(0|1|2|3|4|5|6|7|8|9|〇|一|二|两|三|仨|四|五|六|七|八|九|十|廿|百|千|万|零|壹|贰|叁|肆|伍|陆|柒|捌|玖|拾|佰|仟|萬|\d)+(章|回|部|卷|节|集)\s.*)))|(^\s*((楔\s*子)|(序)).*)|(^\s*后\s*记.*))+$)`)
	log.Println("scompile regexp finish")

	log.Println("split chapters...")
	index := 0
	lastIndex := 0
	fileTitle := strings.TrimSuffix(filepath.Base(p.file), ".txt")
	var loc, lastLoc []int
	for {
		loc = reg.FindStringIndex(p.content[index : p.len-1])
		if loc == nil {
			if index == 0 {
				fmt.Println("no chapter match")
				p.chapters = append(p.chapters, p.genChapterRef(fileTitle, len(p.chapters)+1))
				p.fmtBook.WriteString(p.fmtChapter(fileTitle, len(p.chapters), p.content))
				return
			}
			break
		}
		//fmt.Println("this chapter:", p.content[loc[0] + index: loc[1] + index])

		//match first chapter but not the beginning of text, add content from beginning to first chappter to p.fmtBook
		if index == 0 && loc[0] != 0 {
			p.chapters = append(p.chapters, p.genChapterRef(fileTitle, len(p.chapters)+1))
			p.fmtBook.WriteString(p.fmtChapter(fileTitle, len(p.chapters), p.content[0:loc[0]-1]))
		}

		//if nothing between two chapter, ignore new chapter found
		if lastLoc != nil && (loc[0]+index)-(lastLoc[1]+lastIndex) < 1 {
			fmt.Println("if next chapter locates here, nothing in last chapter, so drop current chapter")
			index = loc[1] + index
			continue
		}

		//add this chapter to p.chapters
		p.chapters = append(p.chapters, p.genChapterRef(p.content[loc[0]+index:loc[1]+index], len(p.chapters)+1))

		//Not the first chapter, add content between last chapter and this chapter to p.fmtBook
		if lastLoc != nil {
			p.fmtBook.WriteString(p.fmtChapter(p.content[lastLoc[0]+lastIndex:lastLoc[1]+lastIndex], len(p.chapters)-1, p.content[lastLoc[1]+lastIndex+1:loc[0]+index-1]))
		}

		lastLoc = loc
		lastIndex = index
		index = loc[1] + index
	}
	//add the last chapter content to p.fmtBook
	p.fmtBook.WriteString(p.fmtChapter(p.content[lastLoc[0]+lastIndex:lastLoc[1]+lastIndex], len(p.chapters), p.content[lastLoc[1]+lastIndex+1:]))
	log.Println("split chapters finish")

	p.bookInfo.Chapters = len(p.chapters)
}

func (p *ReadTxtHandle) genChapterRef(chapter string, num int) string {
	clearChapter := strings.TrimSpace(chapter)
	return fmt.Sprintf("<a href=\"#%d%s\">%s</a>\n", num, clearChapter, clearChapter)
}

func (p *ReadTxtHandle) fmtChapter(chapter string, num int, chapterContent string) string {
	clearChapter := strings.TrimSpace(chapter)
	div := fmt.Sprintf("<div class=\"chapter-page\">")
	positionTag := fmt.Sprintf("<a name=\"%d%s\"></a>\n", num, clearChapter)
	pre := fmt.Sprintf("<pre class=\"chapter-page-pre\">\n")

	preEnd := "</pre>"
	divEnd := "</div>"

	title := fmt.Sprintf("<p class=\"chapter-title\">%s</p>", clearChapter)

	return positionTag + div + title + pre + chapterContent + preEnd + divEnd
}
