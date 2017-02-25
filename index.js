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

/* Sample usage */
// provide relative root path to template assets folder
let instance = new InkyMailOutput('email-template');

// provide mail data & conf --> return promised processed email
instance.produceMail('dev-report', {
        root: 'pages',
        layouts: 'layouts',
        partials: 'partials',
        helpers: 'helpers',
        css: 'css/app.css', // must be repeated in tech data (relative to index.js)
        subject: 'Sprint 3 daily report - CPX Mobile - February 19th 2017, 9:37 am (GMT +1)',
        data: 'data'
    }, {
        reportTitle: 'Sprint daily report',
        reportReleaseSprint: 'EG-CPX Order Visibility R1 / Sprint 3',
        reportTopic:'CPX Mobile Report',
        reportDate: 'February 19th 2017, 9:37 am (GMT +1)',
        overallStatus: 'green',
        subStatuses: [
            { status: 'green', name: 'Portal-Portal Services', usCount: 15 },
            { status: 'green', name: 'Portal-Content Services and Search', usCount: 8 },
            { status: 'red', name: 'Portal-Integration Services', usCount: 2 },
            { status: 'yellow', name: 'Portal-User Services', usCount: 3 }
        ],
        overallIndicators: {
            blockedCount: 0,
            greenCount: 3,
            yellowCount: 2,
            redCount: 23,
            approvedCount: 28,
            approvedPercentage: 100,
            taskedCount: 25,
            taskedPercentage: 82,
            inProgressCount: 28,
            inProgressPercentage: 100,
            inTestingCount: 25,
            inTestingPercentage: 100,
            estimatedLOE: 153,
            currentLOE: 167,
            deviationPercentage: -9
        },
        backlog: {
            usCount: 28,
            backlogItems: [
                { id:4419, name:'rate delivery - feedback webservice [CPX backend]', team:'Portal-Portal Services', status:'In Testing', itStatus:'Green', br:92, link:'https://agilemanager-syd.saas.hp.com/agm/webui/alm/t718469238_hp_com/Channel_Partner_Portal/apm/@3OuIaATvClATx/?TENANTID=718469238#release/release_backlog/shared.update;entityTypeName=requirement;productGroupId=1000;entityId=4419' },  
                { id:4449, name:'rate delivery - Feedback system data sharing (access to PRP database)', team:'Portal-Portal Services', status:'In Testing', itStatus:'Green', br:92, link:'https://agilemanager-syd.saas.hp.com/agm/webui/alm/t718469238_hp_com/Channel_Partner_Portal/apm/@3OuIaATvClATx/?TENANTID=718469238#release/release_backlog/shared.update;entityTypeName=requirement;productGroupId=1000;entityId=4449' },  
                { id:4507, name:'in-app simulation : backend API modification to handle impersonate [CPX backend]', team:'Portal-Portal Services', status:'In Testing', itStatus:'Yellow', br:92, link:'https://agilemanager-syd.saas.hp.com/agm/webui/alm/t718469238_hp_com/Channel_Partner_Portal/apm/@3OuIaATvClATx/?TENANTID=718469238#release/release_backlog/shared.update;entityTypeName=requirement;productGroupId=1000;entityId=4419' },
                { id:4511, name:'Support Page in the Portal Internal Site to display mobile app data and monitoring data', team:'Portal-Portal Services', status:'In Testing', itStatus:'Red', br:92, link:'https://agilemanager-syd.saas.hp.com/agm/webui/alm/t718469238_hp_com/Channel_Partner_Portal/apm/@3OuIaATvClATx/?TENANTID=718469238#release/release_backlog/shared.update;entityTypeName=requirement;productGroupId=1000;entityId=4419' }    
            ]
        },
        metaData: {
            scopeChangeHistory: [
                { date:'13th Dec 2016', unscoped:'', scoped:'#4419', comment:'added to scope (fixing inconsisitency)' },
                { date:'14th Dec 2016', unscoped:'#4673', scoped:'', comment:'removed form AGM' }
            ],
            risks: [
                { date:'6th Jan 2017', type:'Issue', description:'US - 4523 - Advanced Tibco Consumer : development complexity Difficult compregension, too much time passed on explanation', owner:'Hongbin Xu', dueDate:'10th Jan 2017', status:'yellow', comment:'prototype provided waiting for' },
                { date:'9th Jan 2017', type:'Issue', description:'Techdata beta users unable to see their orders in the mobile app Need reindexing on ITG, erfc scheduled for prod on Monday 16', owner:'David George', dueDate:'10th Jan 2017', status:'green', comment:'tested successfuly on ITG, waiting scheduling of erfc David G. availibility checked for next monday Backup identified for other day if erfc moved' }
            ],
            accomplishments: [
                { date:'1st Dec 2016', accomplishment:'Design started' },
                { date:'8th Dec 2016', accomplishment:'Scope lock' }
            ]
        }
    }
).then(
    function(resp) { 
        console.log('successful email render'); 

        fs.writeFileSync(`email-sample.html`, resp, null, function(err) {
            if(err) return console.log('rendered mail HTMLdata error in file write: ', err);
        });
    },
    function(error) { console.log(error); }
);

module.exports = InkyMailOutput;