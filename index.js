const fs            = require('fs');
const panini        = require('panini');
const inky          = require('inky');
const siphon        = require('siphon-media-query');
const lazypipe      = require('lazypipe');

const gulp          = require('gulp');
const plugins       = require('gulp-load-plugins');
const $ = plugins();

class InkyMailOutput {
    constructor() {
        this._mailDataObj   = undefined;
        this._tplName       = undefined;
    }

    produceMail(emailTemplateName, emailDataObj) {
        this._mailDataObj = emailDataObj;
        this._tplName = emailTemplateName;

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
            .pipe($.inlineCss, {
                applyStyleTags: false,
                removeStyleTags: true,
                preserveMediaQueries: true,
                removeLinkTags: false
            })
            .pipe($.replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
            .pipe($.replace, '<link rel="stylesheet" type="text/css" href="css/app.css">', '')
            .pipe($.htmlmin, {
                collapseWhitespace: false,
                minifyCSS: true
            });

        return pipe();
    }
}

/* DEV */
let instance = new InkyMailOutput();

// provide mail data & conf --> return promised processed email
instance.produceMail('basic', {
    root: 'src/pages',
    layouts: 'src/layouts',
    partials: 'src/partials',
    helpers: 'src/helpers',
    css: 'src/css/app.css',
    mailData: {
        subject: 'test subject'
    }
}).then(
    function(resp) { console.log(resp); },
    function(error) { console.log(error); }
);

module.exports = InkyMailOutput;