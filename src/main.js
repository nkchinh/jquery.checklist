import $ from 'jquery';
import { Handlebars } from "handlebars";
import h from "./helpers";

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
			<input ckl-input value="{{value}}" name="{{../inputName}}" type="{{../inputType}}" {{#if ../disabled}}disabled{{/if}} {{#if _chklst_selected}}checked{{/if}}/>
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
	this.each((_, element) => {

		const mopts = $.extend({
			template: $.checklist.defaultTemplate,
			selectAllText: "Select All",
			deselectAllText: "Deselect All",
			deselectText: "Deselect"
		}, opts);

		const _el = $(element);
		const multiple = _el.prop("multiple");
		const inputName = _el.attr('name') || '_ckl_' + inputNameSequense;
		_el.removeAttr('name').hide();
		inputNameSequense ++;

		const context = {
			opts: mopts,
			multiple,
			inputType: multiple ? "checkbox" : "radio",
			inputName,
			disabled: _el.prop('disabled')
		};

		element._ckl_ctx = context;

		funcs.refresh.call(_el);
	});
};

const funcs = {
	selectAll: function(){
		this.each((_, item) => {
			if(item._ckl_ctx && item._ckl_ctx.$ele){
				item._ckl_ctx.$ele
					.find('input:radio,input:checkbox')
					.prop('checked', true);
			} else if($(item).prop('multiple')) {
				$(item).find('option').prop('selected', true);
			}
		});
		return this;
	},
	deselectAll: function(){
		this.each((_, item) => {
			if(item._ckl_ctx && item._ckl_ctx.$ele){
				item._ckl_ctx.$ele
					.find('input:radio,input:checkbox')
					.prop('checked', false);
			} else {
				$(item).find('option').prop('selected', false);
			}
		});
		return this;
	},
	disable: function(){
		this.each((_, item) => {
			if(item._ckl_ctx && item._ckl_ctx.$ele){
				item._ckl_ctx.$ele
					.find('input:radio,input:checkbox')
					.prop('disabled', true);
			} else {
				$(item).prop('disabled', true);
			}
		});
		return this;
	},
	enable: function(){
		this.each((_, item) => {
			if(item._ckl_ctx && item._ckl_ctx.$ele){
				item._ckl_ctx.$ele
					.find('input:radio,input:checkbox')
					.prop('disabled', false);
			} else {
				$(item).prop('disabled', false);
			}
		});
		return this;
	},
	getValue: function(){
		const item = this[0];
		if(!item){
			return;
		}

		if(item._ckl_ctx && item._ckl_ctx.$ele){
			return item._ckl_ctx.$ele.inputVal()[item._ckl_ctx.inputName];
		} 

		return this.val();
	},
	setValue: function(val){
		this.each((_, item) => {
			h.clrChld(item);
			if(!Array.isArray(val)){
				var tmp = val;
				val = [];
				if(tmp != null){
					val.push(tmp);
				}
			}

			for(var i = 0; i < val.length; i++) {
				var opt = document.createElement("option");
				opt.setAttribute("value", val[i]);
				opt.setAttribute("selected", "selected");
				item.appendChild(opt);
			}

			$(item).val(val);
			
			if(item._ckl_ctx && item._ckl_ctx.$ele){
				const value = {};
				value[item._ckl_ctx.inputName] = val;
				item._ckl_ctx.$ele.inputVal(value);
			}
		});
		return this;
	},
	refresh: function() {
		return Promise.all(this.map((_, element) => {
			const _el = $(element);
			const context = element._ckl_ctx;
			if(!context){
				return Promise.resolve();
			}

			const mopts = context.opts;

			// remove old elements
			if(context.$ele){
				context.$ele.remove();
				context.$ele = undefined;
			}

			return (() => {
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
				if(!data){
					data = [];
				}

				const selected = getSelected(element);
	
				for (const item of data){
					item._chklst_selected = selected.indexOf("" + item.value) > -1;
				}
	
				context.items = data;
	
				const tmpl = Handlebars.compile(mopts.template);
				const html = tmpl(context);
				const eles = $(html);
	
				_el.after(eles);
				context.$ele = eles;
	
				eles.find('[ckl-select-all]').click(() => {
					eles.find('input:radio,input:checkbox').prop('checked', true);
				});
	
				eles.find('[ckl-deselect-all]').click(() => {
					eles.find('input:radio,input:checkbox').prop('checked', false);
				});
			});
		}));
	}
};

const getSelected = function(ele) {
	let selected = funcs.getValue.call($(ele));

	if(!$(ele).prop('multiple')){
		if(selected === null || selected === undefined) {
			selected = [];
		} else {
			selected = [selected];
		}
	}

	return selected;
};