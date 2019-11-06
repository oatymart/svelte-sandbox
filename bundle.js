
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/components/ItemRunner.svelte generated by Svelte v3.12.1 */

    const file = "src/components/ItemRunner.svelte";

    function create_fragment(ctx) {
    	var div, h3, t0, t1, t2, img;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text("Item id is ");
    			t1 = text(ctx.itemId);
    			t2 = space();
    			img = element("img");
    			attr_dev(h3, "class", "svelte-zjvpbj");
    			add_location(h3, file, 12, 4, 238);
    			attr_dev(img, "class", "pure-img");
    			attr_dev(img, "src", "https://via.placeholder.com/250x150");
    			add_location(img, file, 13, 4, 271);
    			attr_dev(div, "class", "item-runner svelte-zjvpbj");
    			add_location(div, file, 11, 0, 208);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(div, t2);
    			append_dev(div, img);
    		},

    		p: function update(changed, ctx) {
    			if (changed.itemId) {
    				set_data_dev(t1, ctx.itemId);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { itemId = Math.floor(100 * Math.random()) } = $$props;

    	const writable_props = ['itemId'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ItemRunner> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('itemId' in $$props) $$invalidate('itemId', itemId = $$props.itemId);
    	};

    	$$self.$capture_state = () => {
    		return { itemId };
    	};

    	$$self.$inject_state = $$props => {
    		if ('itemId' in $$props) $$invalidate('itemId', itemId = $$props.itemId);
    	};

    	return { itemId };
    }

    class ItemRunner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["itemId"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "ItemRunner", options, id: create_fragment.name });
    	}

    	get itemId() {
    		throw new Error("<ItemRunner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemId(value) {
    		throw new Error("<ItemRunner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TestRunner.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/components/TestRunner.svelte";

    function create_fragment$1(ctx) {
    	var div, h2, t0, t1, t2, current;

    	var itemrunner = new ItemRunner({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text("Test id is ");
    			t1 = text(ctx.testId);
    			t2 = space();
    			itemrunner.$$.fragment.c();
    			attr_dev(h2, "class", "svelte-1pyz62z");
    			add_location(h2, file$1, 13, 2, 252);
    			attr_dev(div, "class", "test-runner svelte-1pyz62z");
    			add_location(div, file$1, 12, 0, 224);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(div, t2);
    			mount_component(itemrunner, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.testId) {
    				set_data_dev(t1, ctx.testId);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(itemrunner.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(itemrunner.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(itemrunner);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { testId } = $$props;

    	const writable_props = ['testId'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TestRunner> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('testId' in $$props) $$invalidate('testId', testId = $$props.testId);
    	};

    	$$self.$capture_state = () => {
    		return { testId };
    	};

    	$$self.$inject_state = $$props => {
    		if ('testId' in $$props) $$invalidate('testId', testId = $$props.testId);
    	};

    	return { testId };
    }

    class TestRunner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["testId"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TestRunner", options, id: create_fragment$1.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.testId === undefined && !('testId' in props)) {
    			console.warn("<TestRunner> was created without expected prop 'testId'");
    		}
    	}

    	get testId() {
    		throw new Error("<TestRunner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set testId(value) {
    		throw new Error("<TestRunner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	var div1, h1, t0, t1, t2, t3, div0, button0, t5, button1, t7, button2, t9, button3, t10, t11, t12, label, input, t14, current, dispose;

    	var testrunner = new TestRunner({
    		props: { testId: 42 },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(ctx.uppercaseName);
    			t2 = text("!");
    			t3 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "A Pure Button";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "A Disabled Button";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "An Active Button";
    			t9 = space();
    			button3 = element("button");
    			t10 = text("A Primary Button ");
    			t11 = text(age);
    			t12 = space();
    			label = element("label");
    			label.textContent = "Name:";
    			input = element("input");
    			t14 = space();
    			testrunner.$$.fragment.c();
    			attr_dev(h1, "class", "svelte-8xprib");
    			add_location(h1, file$2, 40, 1, 666);
    			attr_dev(button0, "class", "pure-button svelte-8xprib");
    			add_location(button0, file$2, 42, 2, 763);
    			attr_dev(button1, "class", "pure-button svelte-8xprib");
    			button1.disabled = true;
    			add_location(button1, file$2, 43, 2, 835);
    			attr_dev(button2, "class", "pure-button pure-button-active svelte-8xprib");
    			add_location(button2, file$2, 44, 2, 901);
    			attr_dev(button3, "class", "pure-button pure-button-primary svelte-8xprib");
    			add_location(button3, file$2, 45, 2, 976);
    			attr_dev(div0, "class", "pure-button-group svelte-8xprib");
    			attr_dev(div0, "role", "group");
    			attr_dev(div0, "aria-label", "...");
    			add_location(div0, file$2, 41, 1, 699);
    			attr_dev(label, "for", "nameField");
    			attr_dev(label, "class", "svelte-8xprib");
    			add_location(label, file$2, 47, 1, 1065);
    			attr_dev(input, "id", "nameField");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-8xprib");
    			add_location(input, file$2, 47, 37, 1101);
    			attr_dev(div1, "class", "app svelte-8xprib");
    			add_location(div1, file$2, 39, 0, 647);

    			dispose = [
    				listen_dev(button0, "click", alertMe),
    				listen_dev(input, "input", ctx.input_input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t5);
    			append_dev(div0, button1);
    			append_dev(div0, t7);
    			append_dev(div0, button2);
    			append_dev(div0, t9);
    			append_dev(div0, button3);
    			append_dev(button3, t10);
    			append_dev(button3, t11);
    			append_dev(div1, t12);
    			append_dev(div1, label);
    			append_dev(div1, input);

    			set_input_value(input, ctx.name);

    			append_dev(div1, t14);
    			mount_component(testrunner, div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.uppercaseName) {
    				set_data_dev(t1, ctx.uppercaseName);
    			}

    			if (changed.name && (input.value !== ctx.name)) set_input_value(input, ctx.name);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(testrunner.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(testrunner.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			destroy_component(testrunner);

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    let age = 37;

    function alertMe() {
    	alert('hey');
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let name = 'Martin';

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate('name', name);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('age' in $$props) $$invalidate('age', age = $$props.age);
    		if ('uppercaseName' in $$props) $$invalidate('uppercaseName', uppercaseName = $$props.uppercaseName);
    	};

    	let uppercaseName;

    	$$self.$$.update = ($$dirty = { name: 1 }) => {
    		if ($$dirty.name) { $$invalidate('uppercaseName', uppercaseName = name.toUpperCase()); }
    	};

    	return { name, uppercaseName, input_input_handler };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$2.name });
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
