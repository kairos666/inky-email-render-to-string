const fs            = require('fs');
const path          = require('path');
const panini        = require('panini');
const inky          = require('inky');
const siphon        = require('siphon-media-query');
const lazypipe      = require('lazypipe');

const gulp          = require('gulp');
const inlineCss     = require('gulp-inline-css');
const replace       = require('gulp-replace');
const htmlmin       = require('gulp-htmlmin');

class InkyMailOutput {
    constructor(tplPath) {
        this._tplPath       = tplPath;
        this._fullTplPath   = path.join(__dirname, this._tplPath);
        this._mailDataObj   = undefined;
        this._tplName       = undefined;
    }

    produceMail(emailTemplateName, emailConfObj, emailDataObj) {
        this._mailDataObj = {
            root: path.join(this._fullTplPath, emailConfObj.root),
            layouts: path.join(this._tplPath, emailConfObj.layouts),
            partials: path.join(this._tplPath, emailConfObj.partials),
            helpers: path.join(this._tplPath, emailConfObj.helpers),
            css: path.join(this._tplPath, emailConfObj.css),
            data: path.join(this._tplPath, emailConfObj.data)
        };
        this._mailContentObj = emailDataObj;
        this._tplName = emailTemplateName;

        // write tech data json file
        let techObj = {
            css: `../${emailConfObj.css}`
        };
        fs.writeFileSync(`${this._mailDataObj.data}/tech.json`, JSON.stringify(techObj), null, function(err) {
            if(err) return console.log('tech data error in file write: ', err);
        });

        // write main data json file
        let mainObj = {
            subject: emailConfObj.subject
        }
        fs.writeFileSync(`${this._mailDataObj.data}/main.json`, JSON.stringify(mainObj), null, function(err) {
            if(err) return console.log('main data error in file write: ', err);
        });

        // write data json file
        fs.writeFileSync(`${this._mailDataObj.data}/${this._tplName}.json`, JSON.stringify(this._mailContentObj), null, function(err) {
            if(err) return console.log('mail data error in file write: ', err);
        });

        return new Promise((resolve, reject) => {
            this.streamToString(this.buildMail(), 
                function(resp) { resolve(resp); },
                function(error) { reject(error); }
            )
        });
    };

    buildMail() {
        return gulp.src(`${this._mailDataObj.root}/${this._tplName}.html`)
                .pipe(panini(this._mailDataObj))
                .pipe(inky())
                .pipe(this.inliner(this._mailDataObj.css))
    };

    streamToString(stream, successCB, errorCB) {
        let chunks = [];
        stream.on('data', function(chunk) {
            chunks.push(chunk);
        });
        stream.on('error', errorCB);
        stream.on('end', function() {
            // extract content string from Vinyl file object
            let fileContent = JSON.parse(JSON.stringify(chunks))[0];
            let bufferedData = new Buffer(fileContent._contents.data);
            successCB(bufferedData.toString());
        });
    };

    inliner(cssFilePath) {
        let css = fs.readFileSync(cssFilePath).toString();
        let mqCss = siphon(css);

        let pipe = lazypipe()
            .pipe(inlineCss, {
                applyStyleTags: false,
                removeStyleTags: true,
                preserveMediaQueries: true,
                removeLinkTags: false
            })
            .pipe(replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
            .pipe(replace, '<link rel="stylesheet" type="text/css" href="css/app.css">', '')
            .pipe(htmlmin, {
                collapseWhitespace: true,
                minifyCSS: true
            });

        return pipe();
    }
}

module.exports = InkyMailOutput;