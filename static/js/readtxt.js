/**
 * Created by hepeiqin on 2017/10/20.
 */

var toggleChapter = document.getElementById('toggle-chapter');
function toggleChapterVisuable() {
    var chapStyle = document.querySelector('#chapters').style;

    var c = document.getElementById('chapters');
    c.addEventListener('animationend', function() {
        if (chapStyle.animationName === 'hideChapters') {
            chapStyle.visibility = 'hidden';
        }
    });

    if (chapStyle.visibility === 'visible') {
        chapStyle.overflow = 'hidden';
        chapStyle.animationName = 'hideChapters';
        chapStyle.animationDuration = '300ms';
    } else {
        chapStyle.visibility = 'visible';
        chapStyle.overflow = 'auto';
        chapStyle.animationName = 'showChapters';
        chapStyle.animationDuration = '300ms'
    }
}



var showFileInfo = document.getElementById('toggle-file-info');
function toggleFileInfo() {
    var infoStyle = document.querySelector('#file-info').style;
    var infoPreStyle = document.querySelector('#file-info-pre').style;

    var fi = document.getElementById('file-info')
    fi.addEventListener('animationend', function() {
        if (infoStyle.animationName === 'hideInfo') {
            infoStyle.visibility = 'hidden';
        } else {
            infoPreStyle.visibility = 'visible'
        }
    });

    if (infoStyle.visibility === 'visible') {
        infoPreStyle.visibility = 'hidden'
        infoStyle.animationName = 'hideInfo';
        infoStyle.animationDuration = '300ms';
    } else {
        infoPreStyle.visibility = 'hidden';
        infoStyle.visibility = 'visible';
        infoStyle.animationName = 'showInfo';
        infoStyle.animationDuration = '300ms';

    }
}
toggleChapter.addEventListener('click', toggleChapterVisuable, false);
showFileInfo.addEventListener('click', toggleFileInfo, false);