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

let inputNameSequense = 0;

const DEFAULT_TMPL = `<div class="ckl-container">
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
</div>`;

/**
 * init plugin
 * @param {object} opts 
 * @param {boolean=false} opts.actionsBox - When set to true, adds two buttons to the top of the dropdown menu (Select All & Deselect All).
 * @param {string='Select All'} opts.selectAllText - The text on the button that selects all options when actionsBox is enabled.
 * @param {string='Deselect All'} opts.deselectAllText - The text on the button that deselects all options when actionsBox is enabled.
 * @param {string='Deselect'} opts.deselectText - The text on the button that deselects options when actionsBox is enabled.
 * @param {string} opts.template - template
 */
const init = function(opts) {
	this.each((_, item) => {

		const mopts = $.extend({
			template: DEFAULT_TMPL,
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
		if(this._ckl_ctx){
			this._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('checked', true);
		}
	},
	deselectAll: function(){
		if(this._ckl_ctx){
			this._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('checked', false);
		}
	},
	disable: function(){
		if(this._ckl_ctx){
			this._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('disabled', true);
		}
	},
	enable: function(){
		if(this._ckl_ctx){
			this._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('disabled', false);
		}
	},
	getValue: function(){
		if(this._ckl_ctx){
			this._ckl_ctx.$ele.inputVal()[this._ckl_ctx.inputName];
		}
	},
	setValue: function(val){
		if(this._ckl_ctx){
			const value = {};
			value[this._ckl_ctx.inputName] = val;
			this._ckl_ctx.$ele.inputVal(value);
		}
	}
};