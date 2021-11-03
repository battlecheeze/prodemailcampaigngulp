const 
    gulp = require('gulp'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    browserSync = require('browser-sync').create(),
    sass = require('gulp-sass')(require('node-sass')),
    htmlmin = require('gulp-htmlmin')
    siphon = require('siphon-media-query'),
    inlineCss = require('gulp-inline-css'),
    fs = require('graceful-fs'),
    yargs = require('yargs'),
    purgecss = require('gulp-purgecss'),
    gulpIf = require('gulp-if'),
    gulpCond = require('gulp-cond'),
    ifElse = require('gulp-if-else'),
    del = require('del'),
    lazypipe = require('lazypipe'),
    replace = require('gulp-replace'),
    removeEmptyLines = require('gulp-remove-empty-lines'),
    panini = require('panini');

// Look for the --production flag
//const PRODUCTION = !!(yargs.argv.production); // double negative
const PRODUCTION = !!(yargs.argv.production);

// file watch, destination and distribution

const // source
    mapURL = "./",
    globDir = "**/*",
    htmlWatch = "src/" + globDir + ".html",
    sassWatch = "src/sass/" + globDir + ".scss",
    sassBundle = "src/sass/bundle.scss",
    // destination
    cssDest = "src/work/css/",
    cssBundle = "src/work/css/bundle.css",
    htmlDest = "src/work/",
    htmlDestGlob = "src/work/" + globDir + ".html",
    // panini
    paniniPages = "src/pages",
    paniniPagesGlob = paniniPages + "/" + globDir + ".html",
    paniniLayouts = "src/layouts",
    paniniPartials = "src/partials",
    paniniHelpers = "src/helpers",
    // distribution
    paniniData = "src/data",
    cssDist = "dist/css/",
    cssProdBundle = "dist/css/bundle.css"
    prodDist = "dist/",
    prodDistGlob = "dist/" + globDir + ".html",
    // archive
    htmlArchive = "!src/work/archive/" + globDir + ".html",
    sassArchive = "!src/sass/archive/" + globDir + ".scss",
    cssArchive = "!src/work/archive/css/" + globDir + ".css";

function test(done) {
    console.log("Hello this is a test and " + PRODUCTION + " should see here");
    done();
}

function editorHTML() {
    //return gulp.src([htmlWatch, htmlArchive])
    return gulp.src(paniniPagesGlob)
        .pipe(panini({
            root: paniniPages,
            layouts: paniniLayouts,
            partials: paniniPartials,
            helpers: paniniHelpers,
            data: paniniData
        }))
        //.pipe(gulp.dest(htmlDest))
        .pipe(gulp.dest(prodDist))
}


function resetPages(done) {
  panini.refresh();
  done();
}

function clean() {
    return del([
        prodDist,
        cssBundle,
        cssDist,
        htmlDest,
    ]);
}

function editorCSS() {
    return gulp.src([sassWatch, sassArchive])
        .pipe(sass.sync({
            outputStyle: 'compact'
        }).on('error', sass.logError))
        .pipe(postcss([
            autoprefixer()
        ]))
        .pipe(gulpIf(PRODUCTION, purgecss(
           {
              content: [prodDistGlob]
           }
        )))
        .pipe(gulp.dest(cssDist))
      /*
        .pipe(gulpCond(PRODUCTION,
            // if it is true then
            gulp.dest(cssDist),
            // else produce in Distribution
            gulp.dest(cssDest)
        ))
      */
        .pipe(browserSync.stream());
}
/*
function outputCSS() {
    return gulp.src([sassBundle, sassArchive])
    .pipe(sass.sync({
    ┆  outputStyle: 'compact'
    }).on('error', sass.logError))
    .pipe
     (autoprefixer({
      browsers: ['last 2 versions', 'ie > 10']
     }))
    .pipe(gulp.dest(cssDist));
    }
 */

function inline() {
    return gulp.src(prodDistGlob)
         .pipe(gulpIf(PRODUCTION, inliner(cssProdBundle)))
         /*
        .pipe(gulpCond(PRODUCTION,
            inliner(cssProdBundle),
            inliner(cssBundle)
        ))
        */
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(prodDist));
        /*
        .pipe(gulpCond(PRODUCTION,
            // if true then
            gulp.dest(prodDist),
            // else
            gulp.dest(htmlDest)
        ));
        */
}

function inliner(css) {
    var css = fs.readFileSync(css).toString();
    var mqCss = siphon(css);
    
    var pipe = lazypipe()
       .pipe(inlineCss, {
         applyStyleTags: false,
         removeStyleTags: true,
         applyTableAttributes: true,
         preserveMediaQueries: true,
         removeLinkTags: false
       })
       .pipe(replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
       .pipe(replace, '<link rel="stylesheet" type="text/css" href="css/bundle.css">', '');

  return pipe();


}

function browserSYNC(done) {
   browserSync.init({
      server:{
         baseDir: 'dist',
         index: 'index.html'
      },
      browser: [
         '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox', 
         '/Applications/Google Chrome Canary.app/Contents/MacOS/Google\ Chrome\ Canary'
      ]
   });
   done();
}

function watchFiles() {
    gulp.watch(paniniPagesGlob, gulp.series(editorHTML, inline)).on('change', browserSync.reload);
    gulp.watch([paniniLayouts + globDir, paniniPartials + globDir], gulp.series(resetPages, editorHTML, inline)).on('change', browserSync.reload);
    //gulp.watch(['./src/work/{layouts,partials,helpers,data}/**/*'], [panini.refresh]);
    gulp.watch([sassWatch, cssDist + globDir + ".css" ], editorCSS).on('change', browserSync.reload);
}

exports.editorCSS = editorCSS;
exports.editorHTML = editorHTML;
exports.inline = inline;
exports.resetPages = resetPages;
exports.test = test;
exports.clean = clean;
exports.browserSYNC = browserSYNC;
exports.watchFiles = watchFiles;
exports.build = gulp.parallel(gulp.series(clean, editorCSS, editorHTML, inline), browserSYNC, watchFiles);
exports.default = gulp.parallel(gulp.series(clean, editorHTML, editorCSS), browserSYNC, watchFiles);
