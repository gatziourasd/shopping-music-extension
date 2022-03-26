
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* foreground\src\lib\elements\SongItem.svelte generated by Svelte v3.46.4 */

    const file$8 = "foreground\\src\\lib\\elements\\SongItem.svelte";

    function create_fragment$9(ctx) {
    	let li;
    	let img;
    	let img_src_value;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[0]?.name + "";
    	let t1;
    	let t2;
    	let div3;
    	let div0;
    	let t3;
    	let div1;
    	let t4;
    	let div2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			div3 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div1 = element("div");
    			t4 = space();
    			div2 = element("div");
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[0]?.blobIcon ?? '/assets/icons/placeholder-track-icon.png')) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "song icon");
    			attr_dev(img, "class", "svelte-1ll9j41");
    			add_location(img, file$8, 15, 2, 206);
    			attr_dev(span, "class", "item-text svelte-1ll9j41");
    			toggle_class(span, "highlight", /*selected*/ ctx[1]);
    			add_location(span, file$8, 16, 2, 300);
    			attr_dev(div0, "class", "item-icon-end-bar svelte-1ll9j41");
    			add_location(div0, file$8, 18, 4, 429);
    			attr_dev(div1, "class", "item-icon-end-bar svelte-1ll9j41");
    			add_location(div1, file$8, 19, 4, 468);
    			attr_dev(div2, "class", "item-icon-end-bar svelte-1ll9j41");
    			add_location(div2, file$8, 20, 4, 507);
    			attr_dev(div3, "class", "item-icon-end svelte-1ll9j41");
    			toggle_class(div3, "hide", !/*playing*/ ctx[2]);
    			add_location(div3, file$8, 17, 2, 374);
    			attr_dev(li, "draggable", "true");
    			attr_dev(li, "class", "svelte-1ll9j41");
    			add_location(li, file$8, 6, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, img);
    			append_dev(li, t0);
    			append_dev(li, span);
    			append_dev(span, t1);
    			append_dev(li, t2);
    			append_dev(li, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(li, "dragstart", /*dragstart_handler*/ ctx[3], false, false, false),
    					listen_dev(li, "drag", /*drag_handler*/ ctx[4], false, false, false),
    					listen_dev(li, "dragend", /*dragend_handler*/ ctx[5], false, false, false),
    					listen_dev(li, "dragover", /*dragover_handler*/ ctx[6], false, false, false),
    					listen_dev(li, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(li, "contextmenu", /*contextmenu_handler*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[0]?.blobIcon ?? '/assets/icons/placeholder-track-icon.png')) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0]?.name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*selected*/ 2) {
    				toggle_class(span, "highlight", /*selected*/ ctx[1]);
    			}

    			if (dirty & /*playing*/ 4) {
    				toggle_class(div3, "hide", !/*playing*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SongItem', slots, []);
    	let { item } = $$props;
    	let { selected } = $$props;
    	let { playing } = $$props;
    	const writable_props = ['item', 'selected', 'playing'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SongItem> was created with unknown prop '${key}'`);
    	});

    	function dragstart_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function drag_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function dragend_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function dragover_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function contextmenu_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    		if ('playing' in $$props) $$invalidate(2, playing = $$props.playing);
    	};

    	$$self.$capture_state = () => ({ item, selected, playing });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    		if ('playing' in $$props) $$invalidate(2, playing = $$props.playing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		item,
    		selected,
    		playing,
    		dragstart_handler,
    		drag_handler,
    		dragend_handler,
    		dragover_handler,
    		click_handler,
    		contextmenu_handler
    	];
    }

    class SongItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { item: 0, selected: 1, playing: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SongItem",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<SongItem> was created without expected prop 'item'");
    		}

    		if (/*selected*/ ctx[1] === undefined && !('selected' in props)) {
    			console.warn("<SongItem> was created without expected prop 'selected'");
    		}

    		if (/*playing*/ ctx[2] === undefined && !('playing' in props)) {
    			console.warn("<SongItem> was created without expected prop 'playing'");
    		}
    	}

    	get item() {
    		throw new Error("<SongItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<SongItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<SongItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<SongItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get playing() {
    		throw new Error("<SongItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set playing(value) {
    		throw new Error("<SongItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* foreground\src\lib\elements\ContextMenu.svelte generated by Svelte v3.46.4 */

    const file$7 = "foreground\\src\\lib\\elements\\ContextMenu.svelte";

    // (92:0) {#if isOpen}
    function create_if_block$2(ctx) {
    	let div;
    	let ul;
    	let t0;
    	let li;
    	let mounted;
    	let dispose;
    	let if_block = /*songItem*/ ctx[0] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			if (if_block) if_block.c();
    			t0 = space();
    			li = element("li");
    			li.textContent = "Add new track";
    			attr_dev(li, "class", "svelte-15dahx3");
    			add_location(li, file$7, 100, 6, 2614);
    			attr_dev(ul, "class", "menu svelte-15dahx3");
    			set_style(ul, "top", /*position*/ ctx[2].y + "px");
    			set_style(ul, "left", /*position*/ ctx[2].x + "px");
    			add_location(ul, file$7, 93, 4, 2281);
    			attr_dev(div, "class", "container svelte-15dahx3");
    			add_location(div, file$7, 92, 2, 2206);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			if (if_block) if_block.m(ul, null);
    			append_dev(ul, t0);
    			append_dev(ul, li);

    			if (!mounted) {
    				dispose = [
    					listen_dev(li, "click", /*click_handler_2*/ ctx[10], false, false, false),
    					listen_dev(div, "click", /*close*/ ctx[3], false, false, false),
    					listen_dev(div, "contextmenu", prevent_default(/*contextmenu_handler*/ ctx[7]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*songItem*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(ul, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*position*/ 4) {
    				set_style(ul, "top", /*position*/ ctx[2].y + "px");
    			}

    			if (dirty & /*position*/ 4) {
    				set_style(ul, "left", /*position*/ ctx[2].x + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(92:0) {#if isOpen}",
    		ctx
    	});

    	return block;
    }

    // (95:6) {#if songItem}
    function create_if_block_1(ctx) {
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li0 = element("li");
    			li0.textContent = "Edit Icon";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Delete";
    			t3 = space();
    			div = element("div");
    			attr_dev(li0, "class", "svelte-15dahx3");
    			add_location(li0, file$7, 96, 8, 2447);
    			attr_dev(li1, "class", "svelte-15dahx3");
    			add_location(li1, file$7, 97, 8, 2517);
    			attr_dev(div, "class", "divider svelte-15dahx3");
    			add_location(div, file$7, 98, 8, 2572);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, li1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(li0, "click", stop_propagation(/*click_handler*/ ctx[8]), false, false, true),
    					listen_dev(li1, "click", /*click_handler_1*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(li1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(95:6) {#if songItem}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*isOpen*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isOpen*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const maxFileSize = 25000000;
    const maxIconFileSize = 5000000;

    function renameTrack() {
    	
    }

    function addNewTrack() {
    	const fileSelectorElement = document.createElement("input");
    	fileSelectorElement.setAttribute("type", "file");
    	fileSelectorElement.setAttribute("accept", "audio/,.wav,.ogg,.mp3");
    	fileSelectorElement.click();

    	fileSelectorElement.onchange = () => {
    		const reader = new FileReader();

    		reader.onload = () => {
    			chrome.runtime.sendMessage({
    				playlistEvent: {
    					action: "new",
    					data: {
    						blob: reader.result,
    						name: fileSelectorElement.files[0].name.split(".")[0]
    					}
    				}
    			});
    		};

    		if (fileSelectorElement.files[0] && fileSelectorElement.files[0].size <= maxFileSize) {
    			reader.readAsDataURL(fileSelectorElement.files[0]);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ContextMenu', slots, []);
    	let songItem;
    	let isOpen = false;
    	let position = { x: 0, y: 0 };

    	function open(item, pos) {
    		$$invalidate(1, isOpen = true);
    		$$invalidate(0, songItem = item);
    		$$invalidate(2, position = pos);
    	}

    	function close() {
    		$$invalidate(1, isOpen = false);
    		$$invalidate(0, songItem = null);
    		$$invalidate(2, position = null);
    	}

    	function setIcon() {
    		const fileSelectorElement = document.createElement("input");
    		fileSelectorElement.setAttribute("type", "file");
    		fileSelectorElement.setAttribute("accept", "image/,.png,.jpeg,.jpg,.svg");
    		fileSelectorElement.click();
    		const item = songItem;

    		fileSelectorElement.onchange = () => {
    			const reader = new FileReader();

    			reader.onload = () => {
    				chrome.runtime.sendMessage({
    					playlistEvent: {
    						action: "icon",
    						data: { id: item.id, blob: reader.result }
    					}
    				});
    			};

    			if (fileSelectorElement.files[0] && fileSelectorElement.files[0].size <= maxIconFileSize) {
    				reader.readAsDataURL(fileSelectorElement.files[0]);
    			}
    		};

    		close();
    	}

    	function deleteTrack() {
    		chrome.runtime.sendMessage({
    			playlistEvent: {
    				action: "delete",
    				data: { id: songItem.id }
    			}
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ContextMenu> was created with unknown prop '${key}'`);
    	});

    	function contextmenu_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler = () => setIcon();
    	const click_handler_1 = () => deleteTrack();
    	const click_handler_2 = () => addNewTrack();

    	$$self.$capture_state = () => ({
    		songItem,
    		isOpen,
    		position,
    		maxFileSize,
    		maxIconFileSize,
    		open,
    		close,
    		setIcon,
    		renameTrack,
    		deleteTrack,
    		addNewTrack
    	});

    	$$self.$inject_state = $$props => {
    		if ('songItem' in $$props) $$invalidate(0, songItem = $$props.songItem);
    		if ('isOpen' in $$props) $$invalidate(1, isOpen = $$props.isOpen);
    		if ('position' in $$props) $$invalidate(2, position = $$props.position);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		songItem,
    		isOpen,
    		position,
    		close,
    		setIcon,
    		deleteTrack,
    		open,
    		contextmenu_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class ContextMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { open: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContextMenu",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get open() {
    		return this.$$.ctx[6];
    	}

    	set open(value) {
    		throw new Error("<ContextMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* foreground\src\lib\sections\ListSection.svelte generated by Svelte v3.46.4 */
    const file$6 = "foreground\\src\\lib\\sections\\ListSection.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (69:0) {#if itemDragStartIndex !== null}
    function create_if_block$1(ctx) {
    	let div;
    	let songitem;
    	let current;

    	songitem = new SongItem({
    			props: {
    				item: /*playlist*/ ctx[0][/*itemDragStartIndex*/ ctx[1]],
    				selected: /*playlist*/ ctx[0][/*itemDragStartIndex*/ ctx[1]].id === /*selectedItemId*/ ctx[4],
    				playing: /*playing*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(songitem.$$.fragment);
    			set_style(div, "position", "absolute");
    			set_style(div, "left", /*dragStats*/ ctx[7].left + "px");
    			set_style(div, "top", /*dragStats*/ ctx[7].top + "px");
    			set_style(div, "width", /*dragStats*/ ctx[7].width + "px");
    			set_style(div, "pointer-events", "none");
    			add_location(div, file$6, 69, 2, 1893);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(songitem, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const songitem_changes = {};
    			if (dirty & /*playlist, itemDragStartIndex*/ 3) songitem_changes.item = /*playlist*/ ctx[0][/*itemDragStartIndex*/ ctx[1]];
    			if (dirty & /*playlist, itemDragStartIndex, selectedItemId*/ 19) songitem_changes.selected = /*playlist*/ ctx[0][/*itemDragStartIndex*/ ctx[1]].id === /*selectedItemId*/ ctx[4];
    			if (dirty & /*playing*/ 32) songitem_changes.playing = /*playing*/ ctx[5];
    			songitem.$set(songitem_changes);

    			if (!current || dirty & /*dragStats*/ 128) {
    				set_style(div, "left", /*dragStats*/ ctx[7].left + "px");
    			}

    			if (!current || dirty & /*dragStats*/ 128) {
    				set_style(div, "top", /*dragStats*/ ctx[7].top + "px");
    			}

    			if (!current || dirty & /*dragStats*/ 128) {
    				set_style(div, "width", /*dragStats*/ ctx[7].width + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(songitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(songitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(songitem);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(69:0) {#if itemDragStartIndex !== null}",
    		ctx
    	});

    	return block;
    }

    // (88:2) {#each playlist as item, index}
    function create_each_block(ctx) {
    	let div;
    	let songitem;
    	let t;
    	let current;

    	function contextmenu_handler(...args) {
    		return /*contextmenu_handler*/ ctx[9](/*item*/ ctx[17], ...args);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[10](/*item*/ ctx[17]);
    	}

    	function dragstart_handler(...args) {
    		return /*dragstart_handler*/ ctx[11](/*index*/ ctx[19], ...args);
    	}

    	function dragover_handler() {
    		return /*dragover_handler*/ ctx[14](/*index*/ ctx[19]);
    	}

    	songitem = new SongItem({
    			props: {
    				item: /*item*/ ctx[17],
    				selected: /*item*/ ctx[17].id === /*selectedItemId*/ ctx[4],
    				playing: /*playing*/ ctx[5] && /*item*/ ctx[17].id === /*selectedItemId*/ ctx[4]
    			},
    			$$inline: true
    		});

    	songitem.$on("contextmenu", contextmenu_handler);
    	songitem.$on("click", click_handler);
    	songitem.$on("dragstart", dragstart_handler);
    	songitem.$on("drag", /*drag_handler*/ ctx[12]);
    	songitem.$on("dragend", /*dragend_handler*/ ctx[13]);
    	songitem.$on("dragover", dragover_handler);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(songitem.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "wrapper svelte-1cnwnoh");
    			toggle_class(div, "hide", /*itemDragStartIndex*/ ctx[1] === /*index*/ ctx[19]);
    			add_location(div, file$6, 88, 4, 2418);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(songitem, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const songitem_changes = {};
    			if (dirty & /*playlist*/ 1) songitem_changes.item = /*item*/ ctx[17];
    			if (dirty & /*playlist, selectedItemId*/ 17) songitem_changes.selected = /*item*/ ctx[17].id === /*selectedItemId*/ ctx[4];
    			if (dirty & /*playing, playlist, selectedItemId*/ 49) songitem_changes.playing = /*playing*/ ctx[5] && /*item*/ ctx[17].id === /*selectedItemId*/ ctx[4];
    			songitem.$set(songitem_changes);

    			if (dirty & /*itemDragStartIndex*/ 2) {
    				toggle_class(div, "hide", /*itemDragStartIndex*/ ctx[1] === /*index*/ ctx[19]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(songitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(songitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(songitem);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(88:2) {#each playlist as item, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let contextmenu;
    	let t0;
    	let t1;
    	let ul;
    	let current;
    	let mounted;
    	let dispose;
    	let contextmenu_props = {};
    	contextmenu = new ContextMenu({ props: contextmenu_props, $$inline: true });
    	/*contextmenu_binding*/ ctx[8](contextmenu);
    	let if_block = /*itemDragStartIndex*/ ctx[1] !== null && create_if_block$1(ctx);
    	let each_value = /*playlist*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			create_component(contextmenu.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-1cnwnoh");
    			add_location(ul, file$6, 80, 0, 2208);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(contextmenu, target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			/*ul_binding*/ ctx[15](ul);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(ul, "contextmenu", /*contextmenu_handler_1*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const contextmenu_changes = {};
    			contextmenu.$set(contextmenu_changes);

    			if (/*itemDragStartIndex*/ ctx[1] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*itemDragStartIndex*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t1.parentNode, t1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*itemDragStartIndex, playlist, selectedItemId, playing, contextMenu, handlePlayerEvent, dragStats, listElement, itemDragOverIndex, handlePlaylistEvent*/ 255) {
    				each_value = /*playlist*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contextmenu.$$.fragment, local);
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contextmenu.$$.fragment, local);
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*contextmenu_binding*/ ctx[8](null);
    			destroy_component(contextmenu, detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			/*ul_binding*/ ctx[15](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handlePlayerEvent$3(event = {}) {
    	event.action = event?.action ?? "";
    	event.data = event?.data ?? "";
    	chrome.runtime.sendMessage({ playerEvent: event });
    }

    function handlePlaylistEvent(event = {}) {
    	event.action = event?.action ?? "";
    	event.data = event?.data ?? "";
    	chrome.runtime.sendMessage({ playlistEvent: event });
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ListSection', slots, []);
    	let contextMenu;
    	let selectedItemId;
    	let playing;
    	let playlist = [];

    	//___Storage___
    	chrome.storage.local.get("playlist", items => {
    		$$invalidate(0, playlist = [...items.playlist]);
    	});

    	chrome.storage.onChanged.addListener((changes, area) => {
    		if (area !== "local" || !changes?.playlist?.newValue) return;
    		$$invalidate(0, playlist = [...changes.playlist.newValue]);
    	});

    	chrome.storage.local.get("playerState", items => {
    		$$invalidate(4, selectedItemId = items.playerState.trackId);
    		$$invalidate(5, playing = items.playerState.playing);
    	});

    	chrome.storage.onChanged.addListener((changes, area) => {
    		if (area !== "local" || !changes?.playerState?.newValue) return;
    		$$invalidate(4, selectedItemId = changes.playerState.newValue.trackId);
    		$$invalidate(5, playing = changes.playerState.newValue.playing);
    	});

    	//___Drag___
    	let listElement;

    	let itemDragStartIndex = null;
    	let itemDragOverIndex = null;
    	let dragStats = {};
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ListSection> was created with unknown prop '${key}'`);
    	});

    	function contextmenu_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			contextMenu = $$value;
    			$$invalidate(3, contextMenu);
    		});
    	}

    	const contextmenu_handler = (item, event) => {
    		event.preventDefault();
    		event.stopPropagation();
    		contextMenu.open(item, { x: event.clientX, y: event.clientY });
    	};

    	const click_handler = item => {
    		handlePlayerEvent$3({
    			action: "select-track",
    			data: { trackId: item.id }
    		});
    	};

    	const dragstart_handler = (index, event) => {
    		$$invalidate(1, itemDragStartIndex = index);
    		$$invalidate(7, dragStats.left = event.target.getBoundingClientRect().left, dragStats);
    		$$invalidate(7, dragStats.width = event.target.getBoundingClientRect().width, dragStats);
    	};

    	const drag_handler = event => {
    		if (event.clientY > listElement.getBoundingClientRect().bottom - 21) {
    			$$invalidate(7, dragStats.top = listElement.getBoundingClientRect().bottom - 50, dragStats);
    			listElement.scroll({ top: listElement.scrollTop + 10 });
    		} else if (event.clientY < listElement.getBoundingClientRect().top + 39) {
    			$$invalidate(7, dragStats.top = listElement.getBoundingClientRect().top + 18, dragStats);
    			listElement.scroll({ top: listElement.scrollTop - 10 });
    		} else {
    			$$invalidate(7, dragStats.top = event.clientY - 21, dragStats);
    		}
    	};

    	const dragend_handler = () => {
    		$$invalidate(2, itemDragOverIndex = null);
    		$$invalidate(1, itemDragStartIndex = null);
    		$$invalidate(7, dragStats = {});

    		handlePlaylistEvent({
    			action: "reorder",
    			data: {
    				order: playlist.map(track => {
    					return track?.id;
    				})
    			}
    		});
    	};

    	const dragover_handler = index => {
    		$$invalidate(2, itemDragOverIndex = index);
    	};

    	function ul_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			listElement = $$value;
    			$$invalidate(6, listElement);
    		});
    	}

    	const contextmenu_handler_1 = event => {
    		event.preventDefault();
    		contextMenu.open(null, { x: event.clientX, y: event.clientY });
    	};

    	$$self.$capture_state = () => ({
    		SongItem,
    		ContextMenu,
    		contextMenu,
    		selectedItemId,
    		playing,
    		playlist,
    		handlePlayerEvent: handlePlayerEvent$3,
    		handlePlaylistEvent,
    		listElement,
    		itemDragStartIndex,
    		itemDragOverIndex,
    		dragStats
    	});

    	$$self.$inject_state = $$props => {
    		if ('contextMenu' in $$props) $$invalidate(3, contextMenu = $$props.contextMenu);
    		if ('selectedItemId' in $$props) $$invalidate(4, selectedItemId = $$props.selectedItemId);
    		if ('playing' in $$props) $$invalidate(5, playing = $$props.playing);
    		if ('playlist' in $$props) $$invalidate(0, playlist = $$props.playlist);
    		if ('listElement' in $$props) $$invalidate(6, listElement = $$props.listElement);
    		if ('itemDragStartIndex' in $$props) $$invalidate(1, itemDragStartIndex = $$props.itemDragStartIndex);
    		if ('itemDragOverIndex' in $$props) $$invalidate(2, itemDragOverIndex = $$props.itemDragOverIndex);
    		if ('dragStats' in $$props) $$invalidate(7, dragStats = $$props.dragStats);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*itemDragOverIndex, itemDragStartIndex, playlist*/ 7) {
    			{
    				if (itemDragOverIndex !== null && itemDragStartIndex !== null && itemDragOverIndex !== itemDragStartIndex) {
    					$$invalidate(0, [playlist[itemDragStartIndex], playlist[itemDragOverIndex]] = [playlist[itemDragOverIndex], playlist[itemDragStartIndex]], playlist);
    					$$invalidate(1, itemDragStartIndex = itemDragOverIndex);
    				}
    			}
    		}
    	};

    	return [
    		playlist,
    		itemDragStartIndex,
    		itemDragOverIndex,
    		contextMenu,
    		selectedItemId,
    		playing,
    		listElement,
    		dragStats,
    		contextmenu_binding,
    		contextmenu_handler,
    		click_handler,
    		dragstart_handler,
    		drag_handler,
    		dragend_handler,
    		dragover_handler,
    		ul_binding,
    		contextmenu_handler_1
    	];
    }

    class ListSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListSection",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* foreground\src\lib\sections\ButtonSection.svelte generated by Svelte v3.46.4 */

    const file$5 = "foreground\\src\\lib\\sections\\ButtonSection.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let button0;
    	let img;
    	let img_src_value;
    	let t0;
    	let button1;
    	let t2;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			img = element("img");
    			t0 = space();
    			button1 = element("button");
    			button1.textContent = "Mute";
    			t2 = space();
    			button2 = element("button");
    			button2.textContent = "Mute this Session";
    			set_style(img, "margin-top", "5px");
    			if (!src_url_equal(img.src, img_src_value = "/assets/icons/github-icon.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "settings-icon");
    			add_location(img, file$5, 24, 4, 671);
    			attr_dev(button0, "class", "icon-button svelte-1emi45x");
    			add_location(button0, file$5, 20, 2, 553);
    			attr_dev(button1, "class", "svelte-1emi45x");
    			add_location(button1, file$5, 31, 2, 803);
    			attr_dev(button2, "class", "svelte-1emi45x");
    			add_location(button2, file$5, 40, 2, 987);
    			attr_dev(div, "class", "container svelte-1emi45x");
    			add_location(div, file$5, 19, 0, 526);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, img);
    			append_dev(div, t0);
    			append_dev(div, button1);
    			append_dev(div, t2);
    			append_dev(div, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handlePlayerEvent$2(event = {}) {
    	event.action = event?.action ?? "";
    	event.data = event?.data ?? "";
    	chrome.runtime.sendMessage({ playerEvent: event });
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ButtonSection', slots, []);
    	let volume = 100;

    	chrome.storage.local.get("playerState", items => {
    		volume = items.playerState.volume;
    	});

    	chrome.storage.onChanged.addListener((changes, area) => {
    		if (area !== "local" || !changes?.playerState?.newValue) return;
    		volume = changes.playerState.newValue.volume;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ButtonSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => window.open("https://github.com/", "_blank").focus();

    	const click_handler_1 = () => {
    		chrome.runtime.sendMessage({
    			playerEvent: { action: "volume", data: { volume: "0" } }
    		});
    	};

    	const click_handler_2 = () => {
    		chrome.runtime.sendMessage({ playerEvent: { action: "mute-once" } });
    	};

    	$$self.$capture_state = () => ({ volume, handlePlayerEvent: handlePlayerEvent$2 });

    	$$self.$inject_state = $$props => {
    		if ('volume' in $$props) volume = $$props.volume;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [click_handler, click_handler_1, click_handler_2];
    }

    class ButtonSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonSection",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* foreground\src\lib\elements\Divider.svelte generated by Svelte v3.46.4 */

    const file$4 = "foreground\\src\\lib\\elements\\Divider.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-15wua5i");
    			add_location(div, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Divider', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Divider> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Divider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Divider",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* foreground\src\lib\sections\BottomSection.svelte generated by Svelte v3.46.4 */
    const file$3 = "foreground\\src\\lib\\sections\\BottomSection.svelte";

    // (13:0) {#if isSaved !== "not-save-able"}
    function create_if_block(ctx) {
    	let divider;
    	let t0;
    	let button;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let div2_class_value;
    	let t2;
    	let span;
    	let t3_value = (/*isSaved*/ ctx[0] ? "Remove" : "Add") + "";
    	let t3;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	divider = new Divider({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(divider.$$.fragment);
    			t0 = space();
    			button = element("button");
    			div2 = element("div");
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			span = element("span");
    			t3 = text(t3_value);
    			t4 = text(" this Website");
    			attr_dev(div0, "class", "bar svelte-14o3fbx");
    			add_location(div0, file$3, 20, 6, 519);
    			attr_dev(div1, "class", "bar svelte-14o3fbx");
    			add_location(div1, file$3, 21, 6, 546);
    			attr_dev(div2, "class", div2_class_value = "icon " + (/*isSaved*/ ctx[0] ? 'minus' : 'plus') + " svelte-14o3fbx");
    			add_location(div2, file$3, 19, 4, 464);
    			set_style(span, "margin", "-10px");
    			add_location(span, file$3, 23, 4, 583);
    			attr_dev(button, "class", "svelte-14o3fbx");
    			add_location(button, file$3, 14, 2, 366);
    		},
    		m: function mount(target, anchor) {
    			mount_component(divider, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(button, t2);
    			append_dev(button, span);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*isSaved*/ 1 && div2_class_value !== (div2_class_value = "icon " + (/*isSaved*/ ctx[0] ? 'minus' : 'plus') + " svelte-14o3fbx")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if ((!current || dirty & /*isSaved*/ 1) && t3_value !== (t3_value = (/*isSaved*/ ctx[0] ? "Remove" : "Add") + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(divider.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(divider.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(divider, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(13:0) {#if isSaved !== \\\"not-save-able\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*isSaved*/ ctx[0] !== "not-save-able" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isSaved*/ ctx[0] !== "not-save-able") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isSaved*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BottomSection', slots, []);
    	let isSaved = true;
    	chrome.runtime.sendMessage("getIsSaved");

    	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    		if (!message?.getIsSaved) return;
    		$$invalidate(0, isSaved = message.getIsSaved.isSaved);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BottomSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		chrome.runtime.sendMessage("setIsSaved");
    	};

    	$$self.$capture_state = () => ({ Divider, isSaved });

    	$$self.$inject_state = $$props => {
    		if ('isSaved' in $$props) $$invalidate(0, isSaved = $$props.isSaved);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isSaved, click_handler];
    }

    class BottomSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BottomSection",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* foreground\src\lib\sections\PlayerSection.svelte generated by Svelte v3.46.4 */

    const file$2 = "foreground\\src\\lib\\sections\\PlayerSection.svelte";

    function create_fragment$3(ctx) {
    	let div4;
    	let div3;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let div1;
    	let img2;
    	let img2_src_value;
    	let t2;
    	let div2;
    	let img3;
    	let img3_src_value;
    	let t3;
    	let img4;
    	let img4_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div0 = element("div");
    			img1 = element("img");
    			t1 = space();
    			div1 = element("div");
    			img2 = element("img");
    			t2 = space();
    			div2 = element("div");
    			img3 = element("img");
    			t3 = space();
    			img4 = element("img");
    			attr_dev(img0, "height", "25px");
    			if (!src_url_equal(img0.src, img0_src_value = "assets/icons/" + ((/*playerState*/ ctx[0]?.shuffle) ? 'random' : 'order') + ".svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "shuffle-button");
    			add_location(img0, file$2, 21, 4, 608);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/icons/arrow.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			set_style(img1, "transform", "rotateY(180deg)");
    			add_location(img1, file$2, 34, 6, 1004);
    			attr_dev(div0, "class", "control-button svelte-mmpbs1");
    			set_style(div0, "margin-left", "25px");
    			set_style(div0, "margin-right", "18px");
    			add_location(div0, file$2, 28, 4, 830);
    			attr_dev(img2, "width", "25px");
    			if (!src_url_equal(img2.src, img2_src_value = "assets/icons/" + ((/*playerState*/ ctx[0]?.playing) ? 'pause' : 'play') + ".svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$2, 44, 6, 1250);
    			attr_dev(div1, "class", "play-button svelte-mmpbs1");
    			add_location(div1, file$2, 40, 4, 1135);
    			if (!src_url_equal(img3.src, img3_src_value = "assets/icons/arrow.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "");
    			add_location(img3, file$2, 54, 6, 1505);
    			attr_dev(div2, "class", "control-button svelte-mmpbs1");
    			add_location(div2, file$2, 50, 4, 1394);
    			if (!src_url_equal(img4.src, img4_src_value = "assets/icons/" + /*playerState*/ ctx[0]?.loop + ".svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "");
    			attr_dev(img4, "class", "shuffle-button");
    			set_style(img4, "margin-top", "7px");
    			add_location(img4, file$2, 56, 4, 1566);
    			attr_dev(div3, "class", "player-container svelte-mmpbs1");
    			add_location(div3, file$2, 20, 2, 572);
    			attr_dev(div4, "class", "container svelte-mmpbs1");
    			add_location(div4, file$2, 19, 0, 545);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, img0);
    			append_dev(div3, t0);
    			append_dev(div3, div0);
    			append_dev(div0, img1);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, img2);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, img3);
    			append_dev(div3, t3);
    			append_dev(div3, img4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(div0, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(div1, "click", /*click_handler_2*/ ctx[3], false, false, false),
    					listen_dev(div2, "click", /*click_handler_3*/ ctx[4], false, false, false),
    					listen_dev(img4, "click", /*click_handler_4*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*playerState*/ 1 && !src_url_equal(img0.src, img0_src_value = "assets/icons/" + ((/*playerState*/ ctx[0]?.shuffle) ? 'random' : 'order') + ".svg")) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*playerState*/ 1 && !src_url_equal(img2.src, img2_src_value = "assets/icons/" + ((/*playerState*/ ctx[0]?.playing) ? 'pause' : 'play') + ".svg")) {
    				attr_dev(img2, "src", img2_src_value);
    			}

    			if (dirty & /*playerState*/ 1 && !src_url_equal(img4.src, img4_src_value = "assets/icons/" + /*playerState*/ ctx[0]?.loop + ".svg")) {
    				attr_dev(img4, "src", img4_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handlePlayerEvent$1(event = {}) {
    	event.action = event?.action ?? "";
    	event.data = event?.data ?? "";
    	chrome.runtime.sendMessage({ playerEvent: event });
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PlayerSection', slots, []);
    	let playerState;

    	chrome.storage.local.get("playerState", items => {
    		if (items?.playerState) $$invalidate(0, playerState = items.playerState);
    	});

    	chrome.storage.onChanged.addListener((changes, area) => {
    		if (area !== "local" || !changes?.playerState?.newValue) return;
    		$$invalidate(0, playerState = changes.playerState.newValue);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PlayerSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handlePlayerEvent$1({ action: "shuffle" });
    	const click_handler_1 = () => handlePlayerEvent$1({ action: "prev" });
    	const click_handler_2 = () => handlePlayerEvent$1({ action: "toggle-play" });
    	const click_handler_3 = () => handlePlayerEvent$1({ action: "next" });
    	const click_handler_4 = () => handlePlayerEvent$1({ action: "loop" });
    	$$self.$capture_state = () => ({ playerState, handlePlayerEvent: handlePlayerEvent$1 });

    	$$self.$inject_state = $$props => {
    		if ('playerState' in $$props) $$invalidate(0, playerState = $$props.playerState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		playerState,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class PlayerSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayerSection",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* foreground\src\lib\sections\VolumeSection.svelte generated by Svelte v3.46.4 */

    const file$1 = "foreground\\src\\lib\\sections\\VolumeSection.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let svg;
    	let g;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let defs;
    	let filter;
    	let feFlood;
    	let feColorMatrix0;
    	let feOffset;
    	let feGaussianBlur;
    	let feComposite;
    	let feColorMatrix1;
    	let feBlend0;
    	let feBlend1;
    	let t;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			defs = svg_element("defs");
    			filter = svg_element("filter");
    			feFlood = svg_element("feFlood");
    			feColorMatrix0 = svg_element("feColorMatrix");
    			feOffset = svg_element("feOffset");
    			feGaussianBlur = svg_element("feGaussianBlur");
    			feComposite = svg_element("feComposite");
    			feColorMatrix1 = svg_element("feColorMatrix");
    			feBlend0 = svg_element("feBlend");
    			feBlend1 = svg_element("feBlend");
    			t = space();
    			input = element("input");
    			attr_dev(path0, "d", "M15.0677 7.45455H10.9474C10.4242 7.45455 10 7.8787 10 8.40191V13.5981C10 14.1213 10.4242 14.5455 10.9474 14.5455H15.0677C15.3052 14.5455 15.5341 14.6347 15.709 14.7955L19.7798 18.5391C20.3871 19.0975 21.3684 18.6668 21.3684 17.8417V4.15827C21.3684 3.33324 20.3871 2.90247 19.7798 3.46094L15.709 7.20451C15.5341 7.3653 15.3052 7.45455 15.0677 7.45455Z");
    			attr_dev(path0, "fill", "#494949");
    			add_location(path0, file$1, 35, 6, 942);
    			set_style(path1, "opacity", /*sliderValue*/ ctx[0] <= 0 ? '0' : '1');
    			attr_dev(path1, "d", "M22.9843 8.025C24.3065 9.78796 24.3065 12.212 22.9843 13.975L24.3843 15.025C26.1732 12.6398 26.1732 9.36019 24.3843 6.975L22.9843 8.025Z");
    			attr_dev(path1, "fill", "#494949");
    			add_location(path1, file$1, 39, 6, 1353);
    			set_style(path2, "opacity", /*sliderValue*/ ctx[0] < 33 ? '0' : '1');
    			attr_dev(path2, "d", "M25.4343 5.75V5.75C27.9687 8.79122 27.9687 13.2088 25.4343 16.25V16.25");
    			attr_dev(path2, "stroke", "#494949");
    			attr_dev(path2, "stroke-width", "1.75");
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			add_location(path2, file$1, 44, 6, 1607);
    			set_style(path3, "opacity", /*sliderValue*/ ctx[0] < 66 ? '0' : '1');
    			attr_dev(path3, "d", "M27.1843 4V4C30.6912 8.00784 30.6912 13.9922 27.1843 18V18");
    			attr_dev(path3, "stroke", "#494949");
    			attr_dev(path3, "stroke-width", "1.75");
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			add_location(path3, file$1, 52, 6, 1891);
    			attr_dev(g, "filter", "url(#filter0_d_46_56)");
    			add_location(g, file$1, 34, 4, 900);
    			attr_dev(feFlood, "flood-opacity", "0");
    			attr_dev(feFlood, "result", "BackgroundImageFix");
    			add_location(feFlood, file$1, 71, 8, 2411);
    			attr_dev(feColorMatrix0, "in", "SourceAlpha");
    			attr_dev(feColorMatrix0, "type", "matrix");
    			attr_dev(feColorMatrix0, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0");
    			attr_dev(feColorMatrix0, "result", "hardAlpha");
    			add_location(feColorMatrix0, file$1, 72, 8, 2478);
    			attr_dev(feOffset, "dy", "7");
    			add_location(feOffset, file$1, 78, 8, 2659);
    			attr_dev(feGaussianBlur, "stdDeviation", "5");
    			add_location(feGaussianBlur, file$1, 79, 8, 2688);
    			attr_dev(feComposite, "in2", "hardAlpha");
    			attr_dev(feComposite, "operator", "out");
    			add_location(feComposite, file$1, 80, 8, 2733);
    			attr_dev(feColorMatrix1, "type", "matrix");
    			attr_dev(feColorMatrix1, "values", "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0");
    			add_location(feColorMatrix1, file$1, 81, 8, 2789);
    			attr_dev(feBlend0, "mode", "normal");
    			attr_dev(feBlend0, "in2", "BackgroundImageFix");
    			attr_dev(feBlend0, "result", "effect1_dropShadow_46_56");
    			add_location(feBlend0, file$1, 85, 8, 2913);
    			attr_dev(feBlend1, "mode", "normal");
    			attr_dev(feBlend1, "in", "SourceGraphic");
    			attr_dev(feBlend1, "in2", "effect1_dropShadow_46_56");
    			attr_dev(feBlend1, "result", "shape");
    			add_location(feBlend1, file$1, 90, 8, 3049);
    			attr_dev(filter, "id", "filter0_d_46_56");
    			attr_dev(filter, "x", "0");
    			attr_dev(filter, "y", "0.209045");
    			attr_dev(filter, "width", "40.6895");
    			attr_dev(filter, "height", "35.5819");
    			attr_dev(filter, "filterUnits", "userSpaceOnUse");
    			attr_dev(filter, "color-interpolation-filters", "sRGB");
    			add_location(filter, file$1, 62, 6, 2185);
    			add_location(defs, file$1, 61, 4, 2171);
    			attr_dev(svg, "class", "volume-icon svelte-gcus0a");
    			attr_dev(svg, "width", "45");
    			attr_dev(svg, "height", "36");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$1, 20, 2, 604);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "100");
    			attr_dev(input, "class", "slider svelte-gcus0a");
    			add_location(input, file$1, 100, 2, 3238);
    			attr_dev(div, "class", "container svelte-gcus0a");
    			add_location(div, file$1, 19, 0, 577);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, g);
    			append_dev(g, path0);
    			append_dev(g, path1);
    			append_dev(g, path2);
    			append_dev(g, path3);
    			append_dev(svg, defs);
    			append_dev(defs, filter);
    			append_dev(filter, feFlood);
    			append_dev(filter, feColorMatrix0);
    			append_dev(filter, feOffset);
    			append_dev(filter, feGaussianBlur);
    			append_dev(filter, feComposite);
    			append_dev(filter, feColorMatrix1);
    			append_dev(filter, feBlend0);
    			append_dev(filter, feBlend1);
    			append_dev(div, t);
    			append_dev(div, input);
    			set_input_value(input, /*sliderValue*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[2]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[2]),
    					listen_dev(input, "input", /*input_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sliderValue*/ 1) {
    				set_style(path1, "opacity", /*sliderValue*/ ctx[0] <= 0 ? '0' : '1');
    			}

    			if (dirty & /*sliderValue*/ 1) {
    				set_style(path2, "opacity", /*sliderValue*/ ctx[0] < 33 ? '0' : '1');
    			}

    			if (dirty & /*sliderValue*/ 1) {
    				set_style(path3, "opacity", /*sliderValue*/ ctx[0] < 66 ? '0' : '1');
    			}

    			if (dirty & /*sliderValue*/ 1) {
    				set_input_value(input, /*sliderValue*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handlePlayerEvent(event = {}) {
    	event.action = event?.action ?? "";
    	event.data = event?.data ?? "";
    	chrome.runtime.sendMessage({ playerEvent: event });
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VolumeSection', slots, []);
    	let sliderValue = 100;

    	chrome.storage.local.get("playerState", items => {
    		$$invalidate(0, sliderValue = Math.floor(items.playerState.volume * 100));
    	});

    	chrome.storage.onChanged.addListener((changes, area) => {
    		if (area !== "local" || !changes?.playerState?.newValue) return;
    		$$invalidate(0, sliderValue = Math.floor(changes.playerState.newValue.volume * 100));
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VolumeSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, sliderValue = 0);

    		handlePlayerEvent({
    			action: "volume",
    			data: { volume: sliderValue / 100 }
    		});
    	};

    	function input_change_input_handler() {
    		sliderValue = to_number(this.value);
    		$$invalidate(0, sliderValue);
    	}

    	const input_handler = () => {
    		handlePlayerEvent({
    			action: "volume",
    			data: { volume: sliderValue / 100 }
    		});
    	};

    	$$self.$capture_state = () => ({ sliderValue, handlePlayerEvent });

    	$$self.$inject_state = $$props => {
    		if ('sliderValue' in $$props) $$invalidate(0, sliderValue = $$props.sliderValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sliderValue, click_handler, input_change_input_handler, input_handler];
    }

    class VolumeSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VolumeSection",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* foreground\src\lib\pages\MainPage.svelte generated by Svelte v3.46.4 */

    function create_fragment$1(ctx) {
    	let playersection;
    	let t0;
    	let listsection;
    	let t1;
    	let divider0;
    	let t2;
    	let buttonsection;
    	let t3;
    	let divider1;
    	let t4;
    	let volumesection;
    	let t5;
    	let bottomsection;
    	let current;
    	playersection = new PlayerSection({ $$inline: true });
    	listsection = new ListSection({ $$inline: true });
    	divider0 = new Divider({ $$inline: true });
    	buttonsection = new ButtonSection({ $$inline: true });
    	divider1 = new Divider({ $$inline: true });
    	volumesection = new VolumeSection({ $$inline: true });
    	bottomsection = new BottomSection({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(playersection.$$.fragment);
    			t0 = space();
    			create_component(listsection.$$.fragment);
    			t1 = space();
    			create_component(divider0.$$.fragment);
    			t2 = space();
    			create_component(buttonsection.$$.fragment);
    			t3 = space();
    			create_component(divider1.$$.fragment);
    			t4 = space();
    			create_component(volumesection.$$.fragment);
    			t5 = space();
    			create_component(bottomsection.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(playersection, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(listsection, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(divider0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(buttonsection, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(divider1, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(volumesection, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(bottomsection, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playersection.$$.fragment, local);
    			transition_in(listsection.$$.fragment, local);
    			transition_in(divider0.$$.fragment, local);
    			transition_in(buttonsection.$$.fragment, local);
    			transition_in(divider1.$$.fragment, local);
    			transition_in(volumesection.$$.fragment, local);
    			transition_in(bottomsection.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playersection.$$.fragment, local);
    			transition_out(listsection.$$.fragment, local);
    			transition_out(divider0.$$.fragment, local);
    			transition_out(buttonsection.$$.fragment, local);
    			transition_out(divider1.$$.fragment, local);
    			transition_out(volumesection.$$.fragment, local);
    			transition_out(bottomsection.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(playersection, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(listsection, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(divider0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(buttonsection, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(divider1, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(volumesection, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(bottomsection, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MainPage', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MainPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ListSection,
    		ButtonSection,
    		BottomSection,
    		PlayerSection,
    		VolumeSection,
    		Divider
    	});

    	return [];
    }

    class MainPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MainPage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* foreground\src\App.svelte generated by Svelte v3.46.4 */
    const file = "foreground\\src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let switch_instance;
    	let current;
    	var switch_value = /*activePage*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(main, "class", "svelte-12t1t9n");
    			add_location(main, file, 9, 0, 149);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (switch_value !== (switch_value = /*activePage*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const pages = { main: MainPage };
    	let activePage = pages.main;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ MainPage, pages, activePage });

    	$$self.$inject_state = $$props => {
    		if ('activePage' in $$props) $$invalidate(0, activePage = $$props.activePage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [activePage];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=foreground-bundle.js.map
