import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';
import { uglify } from 'rollup-plugin-uglify';
import license from'rollup-plugin-license';
import moment from "moment";

const createMinFileName = (fileName) => {
	const dotInx = fileName.lastIndexOf('.');
	let slashInx = fileName.lastIndexOf('/');
	const bslashInx = fileName.lastIndexOf('\\');

	slashInx = Math.max(slashInx, bslashInx);

	if(dotInx > slashInx){
		return fileName.substring(0, dotInx) + 
			'.min' + fileName.substring(dotInx);
	}

	return fileName + '.min';
};

export default [
	// browser-friendly UMD build
	{
		input: 'src/main.js',
		output: {
			name: pkg.browserModuleName,
			file: pkg.browser,
			format: 'umd',
			globals: {
				'jquery': 'jQuery',
				'handlebars': 'window'
			}
		},
		plugins: [
			resolve(),
			babel({
				exclude: 'node_modules/**'
			}),
			commonjs(),
			//uglify(),
			license({
				banner: `/*!
* ${ pkg.title || pkg.name } - ${ pkg.description }
*
* v${ pkg.version } - ${ moment().format("YYYY-MM-DD") }
*
* ${ pkg.website }
* License: ${ pkg.license }
* Author: ${ (typeof pkg.author === "string") ? pkg.author : (pkg.author.name + " <" + pkg.author.email + ">") }
*/\n`
			})
		],
		external:[
			'jquery',
			'handlebars'
		]
	},
	{
		input: pkg.browser,
		output: {
			file: createMinFileName(pkg.browser),
			format: "cjs"
		},
		context: "window",
		plugins: [
			uglify()
		]
	}
];