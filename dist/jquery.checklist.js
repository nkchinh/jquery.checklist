/*!
* jquery.checklist - Transform select box into radio list or checkbox list
*
* v0.0.1 - 2018-12-21
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

	var h = {
		/**
	  * clear children nodes
	  * @param {HTMLElement} ele 
	  */
		clrChld: function clrChld(ele) {
			if (!ele) {
				return;
			}

			var child = ele.lastChild;

			while (child) {
				var tmp = child.previousSibling;
				ele.removeChild(child);
				child = tmp;
			}
		}
	};

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
		defaultTemplate: "<div class=\"ckl-container\">\n\t{{#if opts.actionsBox}}\n\t<div ckl-actions>\n\t\t{{#if multiple}}\n\t\t<button type=\"button\" ckl-select-all class=\"btn btn-default\" {{#if disabled}}disabled{{/if}}>{{opts.selectAllText}}</button>\n\t\t{{/if}}\n\t\t<button type=\"button\" ckl-deselect-all class=\"btn btn-default\" {{#if disabled}}disabled{{/if}}>{{#if multiple}}{{opts.deselectAllText}}{{else}}{{opts.deselectText}}{{/if}}</button>\n\t</div>\n\t{{/if}}\n\t<ul>\n\t\t{{#each items}}\n\t\t<li ckl-item>\n\t\t\t<input ckl-input value=\"{{value}}\" name=\"{{../inputName}}\" type=\"{{../inputType}}\" {{#if ../disabled}}disabled{{/if}} {{#if _chklst_selected}}checked{{/if}}/>\n\t\t\t{{text}}\n\t\t</li>\n\t\t{{/each}}\n\t</ul>\n\t</div>"
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
		this.each(function (_, element) {

			var mopts = $.extend({
				template: $.checklist.defaultTemplate,
				selectAllText: "Select All",
				deselectAllText: "Deselect All",
				deselectText: "Deselect"
			}, opts);

			var _el = $(element);
			var multiple = _el.prop("multiple");
			var inputName = _el.attr('name') || '_ckl_' + inputNameSequense;
			_el.hide();
			inputNameSequense++;

			var context = {
				opts: mopts,
				multiple: multiple,
				inputType: multiple ? "checkbox" : "radio",
				inputName: inputName,
				disabled: _el.prop('disabled')
			};

			element._ckl_ctx = context;

			funcs.refresh.call(_el);
		});
	};

	var funcs = {
		selectAll: function selectAll() {
			this.each(function (_, item) {
				if (item._ckl_ctx && item._ckl_ctx.$ele) {
					item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('checked', true);
				} else if ($(item).prop('multiple')) {
					$(item).find('option').prop('selected', true);
				}
			});
			return this;
		},
		deselectAll: function deselectAll() {
			this.each(function (_, item) {
				if (item._ckl_ctx && item._ckl_ctx.$ele) {
					item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('checked', false);
				} else {
					$(item).find('option').prop('selected', false);
				}
			});
			return this;
		},
		disable: function disable() {
			this.each(function (_, item) {
				if (item._ckl_ctx && item._ckl_ctx.$ele) {
					item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('disabled', true);
				} else {
					$(item).prop('disabled', true);
				}
			});
			return this;
		},
		enable: function enable() {
			this.each(function (_, item) {
				if (item._ckl_ctx && item._ckl_ctx.$ele) {
					item._ckl_ctx.$ele.find('input:radio,input:checkbox').prop('disabled', false);
				} else {
					$(item).prop('disabled', false);
				}
			});
			return this;
		},
		getValue: function getValue() {
			var item = this[0];
			if (!item) {
				return;
			}

			if (item._ckl_ctx && item._ckl_ctx.$ele && item._ckl_ctx.$ele.find('[name="' + item._ckl_ctx.inputName + '"]').length) {
				return item._ckl_ctx.$ele.inputVal()[item._ckl_ctx.inputName];
			}

			return this.val();
		},
		setValue: function setValue(val) {
			this.each(function (_, item) {
				h.clrChld(item);
				if (!Array.isArray(val)) {
					var tmp = val;
					val = [];
					if (tmp != null) {
						val.push(tmp);
					}
				}

				for (var i = 0; i < val.length; i++) {
					var opt = document.createElement("option");
					opt.setAttribute("value", val[i]);
					opt.setAttribute("selected", "selected");
					item.appendChild(opt);
				}

				$(item).val(val);

				if (item._ckl_ctx && item._ckl_ctx.$ele) {
					var value = {};
					value[item._ckl_ctx.inputName] = val;
					item._ckl_ctx.$ele.inputVal(value);
				}
			});
			return this;
		},
		refresh: function refresh() {
			return Promise.all(this.map(function (_, element) {
				var _el = $(element);
				var context = element._ckl_ctx;
				if (!context) {
					return Promise.resolve();
				}

				var mopts = context.opts;

				// remove old elements
				if (context.$ele) {
					context.$ele.remove();
					context.$ele = undefined;
				}

				return function () {
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
				}().then(function (data) {
					if (!data) {
						data = [];
					}

					if (data.length) {
						_el.removeAttr('name');
					} else {
						_el.attr('name', context.inputName);
					}

					var selected = getSelected(element);

					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var item = _step.value;

							item._chklst_selected = selected.indexOf("" + item.value) > -1;
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator.return) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					context.items = data;

					var tmpl = handlebars.Handlebars.compile(mopts.template);
					var html = tmpl(context);
					var eles = $(html);

					_el.after(eles);
					context.$ele = eles;

					eles.on('change', '[ckl-item] input', function () {
						var val = funcs.getValue.apply(_el);
						if (val) {
							if (!Array.isArray(val)) {
								val = [val];
							}

							_el.html($.map(val, function (v) {
								return "<option value=\"" + v + "\" selected></>";
							}).join(''));
						} else {
							_el.html('');
						}

						_el.trigger('change');
					});

					eles.find('[ckl-select-all]').click(function () {
						eles.find('input:radio,input:checkbox').prop('checked', true);
					});

					eles.find('[ckl-deselect-all]').click(function () {
						eles.find('input:radio,input:checkbox').prop('checked', false);
					});
				});
			}));
		}
	};

	var getSelected = function getSelected(ele) {
		var selected = funcs.getValue.call($(ele));

		if (!$(ele).prop('multiple')) {
			if (selected === null || selected === undefined) {
				selected = [];
			} else {
				selected = [selected];
			}
		}

		return selected;
	};

})));
