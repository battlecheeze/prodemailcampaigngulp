const 
    gulp = require('gulp'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    browserSync = require('browser-sync').create(),
    sass = require('gulp-sass')(require('node-sass')),
    htmlmin = require('gulp-htmlmin')
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
//const PRODUCTION = !!(yargs.argv.production); // double negative
const PRODUCTION = !!(yargs.argv.production);

// file watch, destination and distribution

const // source
    globDir = "**/*",
    sassWatch = "src/sass/" + globDir + ".scss",
    // panini
    paniniPages = "src/pages",
    paniniPagesGlob = paniniPages + "/" + globDir + ".html",
    paniniLayouts = "src/layouts",
    paniniPartials = "src/partials",
    paniniHelpers = "src/helpers",
    // distribution
    paniniData = "src/data",
    cssDist = "dist/css/",
    cssFonts = "dist/css/fonts.css",
    cssMQ = "dist/css/media-queries.css",
    cssProdBundle = "dist/css/bundle.css",
    prodDist = "dist/",
    prodDistGlob = "dist/" + globDir + ".html",
    // archive
    sassArchive = "!src/sass/archive/" + globDir + ".scss";

function editorHTML() {
    return gulp.src(paniniPagesGlob)
        .pipe(panini({
            root: paniniPages,
            layouts: paniniLayouts,
            partials: paniniPartials,
            helpers: paniniHelpers,
            data: paniniData
        }))
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
              content: [prodDistGlob]
           }
        )))
        .pipe(gulp.dest(cssDist))
        .pipe(browserSync.stream());
}

function inline() {
    return gulp.src(prodDistGlob)
        .pipe(gulpIf(PRODUCTION, inliner(cssProdBundle, cssFonts, cssMQ)))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(prodDist));
}

function inliner(css, fonts, mqCss) {
    var css = fs.readFileSync(css).toString();
    var fonts = fs.readFileSync(fonts).toString();
    var mqCss = fs.readFileSync(mqCss).toString();
    
    var pipe = lazypipe()
       .pipe(inlineCss, {
         applyStyleTags: false,
         removeStyleTags: true,
         applyTableAttributes: true,
         preserveMediaQueries: true,
         removeLinkTags: false
       })
       .pipe(replace, '<!-- <fonts> -->', `<style>${fonts}</style>`)
       .pipe(replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
       .pipe(replace, '<link rel="stylesheet" type="text/css" href="css/fonts.css">', '')
       .pipe(replace, '<link rel="stylesheet" type="text/css" href="css/bundle.css">', '')
       .pipe(replace, '<link rel="stylesheet" type="text/css" href="css/media-queries.css">', '');

  return pipe();


}

function browserSYNC(done) {
   browserSync.init({
      server:{
         baseDir: 'dist',
         index: 'index.html'
      },
      // you can choose which browser you want to launch every time ProdEmailCampaign going to run
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
    gulp.watch(sassWatch, gulp.series(resetPages,inline, editorCSS)).on('change', browserSync.reload);
}

exports.editorCSS = editorCSS;
exports.editorHTML = editorHTML;
exports.inline = inline;
exports.resetPages = resetPages;
exports.clean = clean;
exports.browserSYNC = browserSYNC;
exports.watchFiles = watchFiles;
exports.build = gulp.parallel(gulp.series(clean, editorHTML, editorCSS, inline), browserSYNC, watchFiles);
exports.default = gulp.parallel(gulp.series(clean, editorHTML, editorCSS), browserSYNC, watchFiles);
