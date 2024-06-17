const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const del = require('del');
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const fileInclude = require('gulp-file-include');
const watch = require('gulp-watch');

// Пути к файлам
const paths = {
    styles: {
        src: 'src/styles/**/*.scss',
        dest: 'dist/styles'
    },
    scripts: {
        src: 'src/scripts/**/*.js',
        dest: 'dist/scripts'
    },
    images: {
        src: 'src/assets/images/**/*',
        dest: 'dist/assets/images'
    },
    html: {
        src: 'src/*.html',
        dest: 'dist/'
    },
    htmlComponents: {
        src: 'src/templates/components/*.html',
        dest: 'dist/templates/components/'
    }
};

// Компиляция SCSS в CSS
function styles() {
    return gulp.src(paths.styles.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false,
            overrideBrowserslist: ['last 2 versions']
        }))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(cleanCSS())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.stream());
}

// Обработка и минимизация JS
function scripts() {
    return gulp.src(paths.scripts.src, { sourcemaps: true })
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(browserSync.stream());
}

// Оптимизация изображений
function images() {
    return gulp.src(paths.images.src)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.images.dest))
        .pipe(browserSync.stream());
}

// Конвертация изображений в WebP
function webpImages() {
    return gulp.src(paths.images.src)
        .pipe(webp())
        .pipe(gulp.dest(paths.images.dest))
        .pipe(browserSync.stream());
}

// Копирование и инклюд HTML файлов
function html() {
    return gulp.src(paths.html.src)
        .pipe(fileInclude({
            prefix: '@@',
            basepath: 'src/templates/'
        }))
        .pipe(gulp.dest(paths.html.dest))
        .pipe(browserSync.stream());
}

// Удаление файлов в dist
function cleanDeletedImages(event) {
    if (event.event === 'unlink') {
        const filePathFromSrc = event.path;
        const filePathFromDist = filePathFromSrc.replace('src\\assets\\images', 'dist\\assets\\images');
        const filePathFromDistWebp = filePathFromDist.replace(/\.\w+$/, '.webp');
        console.log('File deleted from src: ', filePathFromSrc);
        console.log('File to delete from dist: ', filePathFromDist);
        console.log('File to delete from dist (webp): ', filePathFromDistWebp);
        del([filePathFromDist, filePathFromDistWebp]).then(paths => {
            console.log('Deleted files and folders:\n', paths.join('\n'));
        });
    }
}

// Слежение за изменениями в файлах
function watchFiles() {
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.images.src, gulp.series(images, webpImages));
    gulp.watch(paths.html.src, html);
    gulp.watch(paths.htmlComponents.src, html);
    watch(paths.images.src, cleanDeletedImages);
}

// Запуск сервера
function serve() {
    browserSync.init({
        server: {
            baseDir: "./dist"
        }
    });

    // Обновление сервера при изменениях в папке dist
    gulp.watch('dist/**/*').on('change', browserSync.reload);
}

// Определение задач
const build = gulp.series(gulp.parallel(styles, scripts, images, webpImages, html));
const watchTask = gulp.parallel(watchFiles, serve);

// Экспорт задач
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.webpImages = webpImages;
exports.html = html;
exports.watch = watchTask;
exports.build = build;
exports.default = watchTask;
