/*!
* jquery.checklist - Transform select box into radio list or checkbox list
*
* v0.0.1 - 2018-06-27
*
* tandan.com.vn
* License: MIT
* Author: Chinh Nguyen
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('jquery'), require('handlebars')) :
	typeof define === 'function' && define.amd ? define(['jquery', 'handlebars'], factory) :
	(factory(global.jQuery,global.window));
}(this, (function ($,handlebars) { 'use strict';

	$ = $ && $.hasOwnProperty('default') ? $['default'] : $;

	$.fn.checklist = function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		if (typeof args[0] === 'string') {
			var func = funcs[args[0]];
			if (typeof func === 'function') {
				return func.apply(this, Array.prototype.slice.call(args, 1));
			}

			console.error(args[0] + ' is not a function.');
		} else {
			init.apply(this, args);
		}
	};

	$.checklist = {
		defaultTemplate: '<div class="ckl-container">\n\t{{#if opts.actionsBox}}\n\t<div ckl-actions>\n\t\t{{#if multiple}}\n\t\t<button type="button" ckl-select-all class="btn btn-default" {{#if disabled}}disabled{{/if}}>{{opts.selectAllText}}</button>\n\t\t{{/if}}\n\t\t<button type="button" ckl-deselect-all class="btn btn-default" {{#if disabled}}disabled{{/if}}>{{#if multiple}}{{opts.deselectAllText}}{{else}}{{opts.deselectText}}{{/if}}</button>\n\t</div>\n\t{{/if}}\n\t<ul>\n\t\t{{#each items}}\n\t\t<li ckl-item>\n\t\t\t<input ckl-input value="{{value}}" name="{{../inputName}}" type="{{../inputType}}" {{#if ../disabled}}disabled{{/if}}/>\n\t\t\t{{text}}\n\t\t</li>\n\t\t{{/each}}\n\t</ul>\n\t</div>'
	};

	var inputNameSequense = 0;

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
	var init = function init(opts) {
		this.each(function (_, item) {

			var mopts = $.extend({
				template: $.checklist.defaultTemplate,
				selectAllText: "Select All",
				deselectAllText: "Deselect All",
				deselectText: "Deselect"
			}, opts);

			var _el = $(item);
			var multiple = _el.prop("multiple");

			var inputName = _el.attr('name') || '_ckl_' + inputNameSequense;
			inputNameSequense++;
			_el.removeAttr('name').hide();

			var context = {
				opts: mopts,
				multiple: multiple,
				inputType: multiple ? "checkbox" : "radio",
				inputName: inputName,
				disabled: _el.prop('disabled')
			};

			(function () {
				if (mopts.hasOwnProperty("ajax")) {
					if (typeof mopts.ajax === "function") {
						return mopts.ajax();
					}

					return new Promise(function (resolve, reject) {
						$.ajax(mopts.ajax).done(resolve).fail(reject);
					});
				}

				return Promise.resolve(_el.find("option").map(function (_, item) {
					var $it = $(item);

					return {
						value: $it.attr('value'),
						text: $it.text()
					};
				}).toArray());
			})().then(function (data) {
				context.items = data;

				var tmpl = handlebars.Handlebars.compile(mopts.template);
				var html = tmpl(context);
				var eles = $(html);

				_el.after(eles);
				_el[0]._ckl_ctx = $.extend({
					$ele: eles
				}, context);

				eles.find('[ckl-select-all]').click(function () {
					eles.find('input:radio,input:checkbox').prop('checked', true);
				});

				eles.find('[ckl-deselect-all]').click(function () {
					eles.find('input:radio,input:checkbox').prop('checked', false);
				});
			});
		});
	};

	var funcs = {
		selectAll: function selectAll() {
			this.each(function (_, item) {
				if (item._ckl_ctx) {
					item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('checked', true);
				}
			});
			return this;
		},
		deselectAll: function deselectAll() {
			this.each(function (_, item) {
				if (item._ckl_ctx) {
					item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('checked', false);
				}
			});
			return this;
		},
		disable: function disable() {
			this.each(function (_, item) {
				if (item._ckl_ctx) {
					item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('disabled', true);
				}
			});
			return this;
		},
		enable: function enable() {
			this.each(function (_, item) {
				if (item._ckl_ctx) {
					item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('disabled', false);
				}
			});
			return this;
		},
		getValue: function getValue() {
			var item = this[0];
			if (!item) {
				return;
			}

			if (item._ckl_ctx) {
				return item._ckl_ctx.$ele.inputVal()[item._ckl_ctx.inputName];
			}
		},
		setValue: function setValue(val) {
			this.each(function (_, item) {
				if (item._ckl_ctx) {
					var value = {};
					value[item._ckl_ctx.inputName] = val;
					item._ckl_ctx.$ele.inputVal(value);
				}
			});
			return this;
		}
	};

})));
