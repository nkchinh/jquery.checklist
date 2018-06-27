import $ from 'jquery';
import { Handlebars } from "handlebars";

$.fn.checklist = function(...args){
	if (typeof args[0] === 'string') {
		const func = funcs[args[0]];
		if (typeof func === 'function') {
			return func.apply(this, Array.prototype.slice.call(args, 1));
		} 

		console.error(args[0] + ' is not a function.');
		
	} else {
		init.apply(this, args);
	}
};

$.checklist = {
	defaultTemplate: `<div class="ckl-container">
	{{#if opts.actionsBox}}
	<div ckl-actions>
		{{#if multiple}}
		<button type="button" ckl-select-all class="btn btn-default" {{#if disabled}}disabled{{/if}}>{{opts.selectAllText}}</button>
		{{/if}}
		<button type="button" ckl-deselect-all class="btn btn-default" {{#if disabled}}disabled{{/if}}>{{#if multiple}}{{opts.deselectAllText}}{{else}}{{opts.deselectText}}{{/if}}</button>
	</div>
	{{/if}}
	<ul>
		{{#each items}}
		<li ckl-item>
			<input ckl-input value="{{value}}" name="{{../inputName}}" type="{{../inputType}}" {{#if ../disabled}}disabled{{/if}}/>
			{{text}}
		</li>
		{{/each}}
	</ul>
	</div>`
};

let inputNameSequense = 0;

/**
 * init plugin
 * @param {object} opts 
 * @param {boolean=false} opts.actionsBox - When set to true, adds two buttons to the top of the dropdown menu (Select All & Deselect All).
 * @param {string='Select All'} opts.selectAllText - The text on the button that selects all options when actionsBox is enabled.
 * @param {string='Deselect All'} opts.deselectAllText - The text on the button that deselects all options when actionsBox is enabled.
 * @param {string='Deselect'} opts.deselectText - The text on the button that deselects options when actionsBox is enabled.
 * @param {string} opts.template - template
 * @param {object|function} ajax
 */
const init = function(opts) {
	this.each((_, item) => {

		const mopts = $.extend({
			template: $.checklist.defaultTemplate,
			selectAllText: "Select All",
			deselectAllText: "Deselect All",
			deselectText: "Deselect"
		}, opts);

		const _el = $(item);
		const multiple = _el.prop("multiple");

		const inputName = _el.attr('name') || '_ckl_' + inputNameSequense;
		inputNameSequense ++;
		_el.removeAttr('name').hide();

		const context = {
			opts: mopts,
			multiple,
			inputType: multiple ? "checkbox" : "radio",
			inputName,
			disabled: _el.prop('disabled')
		};

		(() => {
			if(mopts.hasOwnProperty("ajax")) {
				if(typeof mopts.ajax === "function"){
					return mopts.ajax();
				} 

				return new Promise((resolve, reject) => {
					$.ajax(mopts.ajax).done(resolve).fail(reject);
				});
			} 

			return Promise.resolve(_el.find("option").map((_, item) => {
				const $it = $(item);

				return {
					value: $it.attr('value'),
					text: $it.text()
				};
			}).toArray());
		})()
		.then(data => {
			context.items = data;

			const tmpl = Handlebars.compile(mopts.template);
			const html = tmpl(context);
			const eles = $(html);

			_el.after(eles);
			_el[0]._ckl_ctx = $.extend({
				$ele: eles
			}, context);

			eles.find('[ckl-select-all]').click(() => {
				eles.find('input:radio,input:checkbox').prop('checked', true);
			});

			eles.find('[ckl-deselect-all]').click(() => {
				eles.find('input:radio,input:checkbox').prop('checked', false);
			});
		});
	});
};

const funcs = {
	selectAll: function(){
		this.each((_, item) => {
			if(item._ckl_ctx){
				item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('checked', true);
			}
		});
		return this;
	},
	deselectAll: function(){
		this.each((_, item) => {
			if(item._ckl_ctx){
				item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('checked', false);
			}
		});
		return this;
	},
	disable: function(){
		this.each((_, item) => {
			if(item._ckl_ctx){
				item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('disabled', true);
			}
		});
		return this;
	},
	enable: function(){
		this.each((_, item) => {
			if(item._ckl_ctx){
				item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('disabled', false);
			}
		});
		return this;
	},
	getValue: function(){
		const item = this[0];
		if(!item){
			return;
		}

		if(item._ckl_ctx){
			return item._ckl_ctx.$ele.inputVal()[item._ckl_ctx.inputName];
		}
	},
	setValue: function(val){
		this.each((_, item) => {
			if(item._ckl_ctx){
				const value = {};
				value[item._ckl_ctx.inputName] = val;
				item._ckl_ctx.$ele.inputVal(value);
			}
		});
		return this;
	}
};