const gulp = require('gulp'),
	path = require('path'),
	babel = require('gulp-babel'),
	uglify = require('gulp-uglify'),
	minify = require('gulp-minify-css');

const APP_PATH = path.resolve(__dirname, 'public');

gulp.task('js', () => {
	return gulp.src(`${APP_PATH}\\javascripts\\*.js`, {base: APP_PATH})
		.pipe(babel())
		.pipe(uglify())
		.pipe(gulp.dest('dist'));
});

gulp.task('css', () => {
	return gulp.src(`${APP_PATH}\\stylesheets\\*.css`, {base: APP_PATH})
		.pipe(minify())
		.pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.parallel('js', 'css'));