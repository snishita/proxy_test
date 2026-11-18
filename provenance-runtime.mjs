(() => {
	const labels = new WeakMap();

	// Scope correctness テスト用
	const markedObjects = [];

	function isObjectLike(value) {
		return (value !== null && (typeof value === 'object' || typeof value === 'function'));
	}
	globalThis.__provMark = function (value, label) {
		if (isObjectLike(value)) {
			labels.set(value, label);
		}
		markedObjects.push({value,label});
		return value;
	};
	globalThis.__provGetLabel = function (value) {
		if (!isObjectLike(value)) {
			return undefined;
		}
		return labels.get(value);
	};
	globalThis.__provGetMarkedObjects = function () {
		return markedObjects;
	};

	globalThis.__provMarkObjectMethods = function (obj, methods, label) {
		for (const [kind, key] of methods) {
			const descriptor = Object.getOwnPropertyDescriptor(obj, key);
			if (descriptor === undefined) {
				continue;
			}

			switch (kind) {
				case "method":
					__provMark(descriptor.value, label);
					break;
				case "get":
					__provMark(descriptor.get, label);
					break;
				case "set":
					__provMark(descriptor.set, label);
					break;
			}
		}
		return obj;
	}
})();

