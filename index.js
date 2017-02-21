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

    produceMail(emailTemplateName, emailConfObj, emailDataObj) {
        this._mailDataObj = emailConfObj;
        this._mailContentObj = emailDataObj;
        this._tplName = emailTemplateName;

        // write data json file
        fs.writeFileSync(`${this._mailDataObj.data}/${this._tplName}.json`, JSON.stringify(this._mailContentObj), null, function(err) {
            if(err) return console.log(err);
            console.log('written email json file');
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
            .pipe($.inlineCss, {
                applyStyleTags: false,
                removeStyleTags: true,
                preserveMediaQueries: true,
                removeLinkTags: false
            })
            .pipe($.replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
            .pipe($.replace, '<link rel="stylesheet" type="text/css" href="css/app.css">', '')
            .pipe($.htmlmin, {
                collapseWhitespace: true,
                minifyCSS: true
            });

        return pipe();
    }
}

/* Sample usage */
let instance = new InkyMailOutput();

// provide mail data & conf --> return promised processed email
instance.produceMail('dev-report', {
        root: 'email-template/pages',
        layouts: 'email-template/layouts',
        partials: 'email-template/partials',
        helpers: 'email-template/helpers',
        css: 'email-template/css/app.css', // must be repeated here and in data (relative to index.js)
        data: 'email-template/data'
    }, {
        css: '../css/app.css',
        subject: 'TEST SUBJECT',
        backlogItems: ['one', 'two', 'three']
    }
).then(
    function(resp) { console.log(resp); },
    function(error) { console.log(error); }
);

module.exports = InkyMailOutput;