const 
    gulp = require('gulp'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    browserSync = require('browser-sync').create(),
    sass = require('gulp-sass')(require('node-sass')),
    htmlmin = require('gulp-htmlmin'),
    inlineCss = require('gulp-inline-css'),
    fs = require('graceful-fs'),
    yargs = require('yargs'),
    purgecss = require('gulp-purgecss'),
    gulpIf = require('gulp-if'),
    del = require('del'),
    lazypipe = require('lazypipe'),
    replace = require('gulp-replace'),
    removeEmptyLines = require('gulp-remove-empty-lines'),
    panini = require('panini');

// Look for the --production flag
//const PRODUCTION = !!(yargs.argv.production); // double negative beacuse it's true~
const PRODUCTION = !!(yargs.argv.production);

// file watch, destination and distribution

const // source
    globDir = "**/*",
    sassWatch = "src/sass/" + globDir + ".scss",
    // images
    img = "src/images",
    // panini
    paniniPages = "src/pages",
    paniniPagesArchive = "!src/pages/archive/" + globDir + ".html",
    paniniPagesGlob = paniniPages + "/" + globDir + ".html",
    paniniLayouts = "src/layouts",
    paniniLayoutsArchive = "!src/layouts/archive",
    paniniPartials = "src/partials",
    paniniPartialsGlob = paniniPartials + "/" + globDir + ".html",
    paniniPartialsArchive = "!src/partials/archive",
    paniniHelpers = "src/helpers",
    paniniData = "src/data",
    // distribution
    cssDist = "dist/css/",
    //cssFonts = "dist/css/fonts.css", // only when it is needed to call
    cssEmailAppFix = "dist/css/emailappfixes.css",
    imgDist = "dist/images",
    cssMQ = "dist/css/media-queries.css",
    cssProdBundle = "dist/css/bundle.css",
    prodDist = "dist/",
    prodDistGlob = "dist/" + globDir + ".html",
    // archive
    sassArchive = "!src/sass/archive/" + globDir + ".scss";

function editorHTML() {
    return gulp.src([paniniPagesGlob, paniniPagesArchive, paniniLayoutsArchive, paniniPartialsArchive])
        .pipe(panini({
            root: paniniPages,
            layouts: paniniLayouts,
            partials: paniniPartials,
            helpers: paniniHelpers,
            data: paniniData
        }))
        .pipe(gulp.dest(prodDist))
}

function htmlMinifier() {
   return gulp.src(prodDistGlob)
      .pipe(htmlmin({collapseWhitespace: true}))
      .pipe(gulp.dest(prodDist))
}

function resetPages(done) {
  panini.refresh();
  done();
}

function clean() {
    return del([
        prodDistGlob,
        cssDist,
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
        // will purge unused css in the styling format to reduce the size of the file 
        .pipe(gulpIf(PRODUCTION, purgecss(
           {
              content: [prodDistGlob],
              FontFace: true, // purge fonts that aren't needed
              //output: "dist/purgedcss/purged.txt"
           }
        )))
        .pipe(gulp.dest(cssDist))
        .pipe(browserSync.stream());
}

function inline() {
    return gulp.src(prodDistGlob)
        //.pipe(gulpIf(PRODUCTION, inliner(cssMQ)))
        .pipe(gulpIf(PRODUCTION, inliner(cssProdBundle, cssMQ)))
        //.pipe(gulpIf(PRODUCTION, inliner(cssProdBundle, cssFonts, cssEmailAppFix, cssMQ)))
        // will remove empty lines on the final product
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(prodDist));
}

//function inliner(css, fonts,fixin, mqCss) {
//function inliner(css ,fixin, mqCss) {
function inliner(css, mqCss) {
//function inliner(mqCss) {
    var css = fs.readFileSync(css).toString();
    //var fonts = fs.readFileSync(fonts).toString();
    //var fixin = fs.readFileSync(fixin).toString();
    var mqCss = fs.readFileSync(mqCss).toString();
    
    var pipe = lazypipe()
       .pipe(inlineCss, {
         applyStyleTags: false,
         removeStyleTags: true,
         preserveMediaQueries: true,
         removeLinkTags: false
       })
       //.pipe(replace, '<!-- <fonts> -->', `<style>${fonts}</style>`)
       //.pipe(replace, '<!-- <fixes> -->', `<style>${fixin}</style>`)
       .pipe(replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
       //.pipe(replace, '<link rel="stylesheet" type="text/css" href="css/fonts.css">', '')
       //.pipe(replace, '<link rel="stylesheet" type="text/css" href="css/emailappfixes.css">', '')
       .pipe(replace, '<link rel="stylesheet" type="text/css" href="css/bundle.css">', '')
       .pipe(replace, '<link rel="stylesheet" type="text/css" href="css/media-queries.css">', '')
       .pipe(replace, '<!--remove this in final', '')
       .pipe(replace, 'remove this in final-->', '');

  return pipe();


}

function browserSYNC(done) {
   browserSync.init({
      server:{
         baseDir: 'dist',
         index: 'index.html'
      },
      // you can choose which browser you want to launch every time ProdEmailCampaign is going to run
      // By the way, the settings are for mac
      browser: [
         '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox', 
         '/Applications/Google Chrome Canary.app/Contents/MacOS/Google\ Chrome\ Canary'
      ]
   });
   done();
}

function watchFiles() {
    gulp.watch(paniniPagesGlob, gulp.series(editorHTML, inline)).on('change', browserSync.reload);
    gulp.watch([paniniLayouts + globDir, paniniPartialsGlob, paniniData + globDir], gulp.series(resetPages, editorHTML, inline)).on('change', browserSync.reload);
    gulp.watch(sassWatch, gulp.series(resetPages,inline, editorCSS)).on('change', browserSync.reload);
    gulp.watch([img, imgDist]).on('change', browserSync.reload);
}

exports.editorCSS = editorCSS;
exports.editorHTML = editorHTML;
exports.htmlMinifier = htmlMinifier;
exports.inline = inline;
exports.resetPages = resetPages;
exports.clean = clean;
exports.browserSYNC = browserSYNC;
exports.watchFiles = watchFiles;
exports.build = gulp.parallel(gulp.series(clean, editorHTML, editorCSS, inline), browserSYNC, watchFiles);
exports.default = gulp.parallel(gulp.series(clean, editorHTML, editorCSS), browserSYNC, watchFiles);
