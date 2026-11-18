(() => {
	const safeReflectGet = Reflect.get;
	const safeReflectGetOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;

	const targetToInfo = new WeakMap();
	const proxyToInfo = new WeakMap();
	let count = 0;
	const msgs = [];

	function log(msg) {
		msgs.push(msg);
	}

	/*
	globalThis.get_wrapper_log = function() {
		return msgs.join('\n');
	};
	*/

	//globalThis.__scopeIsWrapped = value => targetToInfo.has(value);

	function prettyPrint(val) {
		if (isObjectLike(val)) {
			const type = typeof val;
			let infomsg = '';
			if (proxyToInfo.get(val)) {
				infomsg = `proxy#${proxyToInfo.get(val).id}`;
			} else if (targetToInfo.get(val)) {
				infomsg = `target of proxy#${targetToInfo.get(val).id}`;
			}
			if (type === 'function') {
				// 関数の場合は名前を取得（無名関数の場合は空文字）
				return `function: ${val.name || 'anonymous'}, ${infomsg}`;
			} else if (type === 'object') {
				// 配列かオブジェクトかを判定し、コンストラクタ名を取得
				const className = Object.prototype.toString.call(val).slice(8, -1);
				return `object: ${className}, ${infomsg}`;
			}
		} else if (val === null) {
			return 'null';
		} else {
			// プリミティブ型（数値、文字列、真偽値、undefined、Symbol）はそのまま型名を返す
			return typeof val;
		}
	}

	const handler = {
		get(target, prop, receiver) {
			const actualReceiver = unwrap(receiver);

			log(`get: ${prettyPrint(target)}`);
			const rawResult = safeReflectGet(
                target,
                prop,
                actualReceiver
            );

			if (isObjectLike(rawResult)) {
				const descriptor = safeReflectGetOwnPropertyDescriptor(target, prop);
				if (descriptor !== undefined
						&& 'value' in descriptor
						&& descriptor.configurable === false
						&& descriptor.writable == false) {
					return rawResult;
				} else {
					return wrap(rawResult);
				}
			} else {
				return rawResult;
			}
		}
	}

	function isObjectLike(x) {
		return (typeof x === 'object' && x !== null || typeof x === 'function');
	}

	function wrap(x) {
		if (!isObjectLike(x)) {
			return x;
		}
		if (targetToInfo.has(x)) {
			return targetToInfo.get(x).proxy;
		}
		if (proxyToInfo.has(x)) {
			return x;
		}
		const proxy = new Proxy(x, handler);
		const info = { target:x, proxy, id:count };
		targetToInfo.set(x, info);
		proxyToInfo.set(proxy, info);

		count += 1;

		return proxy;
	}

	function unwrap(x) {
		if (!isObjectLike(x)) {
			return x;
		}
		if (proxyToInfo.has(x)) {
			return proxyToInfo.get(x).target;
		}
		if (targetToInfo.has(x)) {
			return x;
		}
		return x;
	}

	let properties = Object.getOwnPropertyNames(globalThis);
	const blackList = ['Object', 'String', 'Number', 'Boolean', 'Array',
		//'Map',
		'Promise', 'Set',
		'RegExp', 'Error', 'Proxy', 'Reflect', 'TypeError',
		'saveCall', 'saveGet', 'saveSet', 'saveConstruct', 'classification',
		'exportLog', 'logObjects',
		'clientInformation', 'parent', 'top', 'window',
		'__proto__',
		//'ArrayBuffer', 'AggregateError',      // 追加にしなくてもテストは実行可能 07/22
	];
	for (const p of properties) {
	    if (blackList.includes(p) || p.startsWith('__vitest_')) {
			//exclude(window[p]); // blackList のプロパティはラップしない．除外を宣言しておく
	    } else {
			// isLoggingTargetを使って対象を判定する
			// 関数とオブジェクトのみプロキシで置き換える
			if (typeof globalThis[p] === 'function') {
				// window[p]が関数の場合
				//safeConsoleLog('function: ' + p);
				const newTarget = wrap(globalThis[p]);
				if (globalThis[p] !== newTarget) {
					globalThis[p] = newTarget;
				}
			//} else if (Object.hasOwn(globalThis, 'window') && globalThis[p] === globalThis.window
			//		|| Object.hasOwn(globalThis, 'location') && globalThis[p] === globalThis.location) {
			} else if (globalThis[p] === globalThis || p === 'location') {
				//exclude(window[p]);     // window と window.location は除外
			} else if(typeof globalThis[p] === 'object' && globalThis[p] !== null) {
				const proto = Object.getPrototypeOf(globalThis[p]);
				const newProto = wrap(proto);
				if (proto !== newProto) {
					//safeConsoleLog('wrapped: ' + p);
					Object.setPrototypeOf(globalThis[p], newProto);
				}
			}
		}
	}
})();
