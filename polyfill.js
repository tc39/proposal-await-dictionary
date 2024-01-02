(function () {
    if (!Promise.ownProperties) {
        function ownProperties(obj) {
            if (typeof obj !== "object")
                throw new TypeError("Object expected");

            if (obj === null || obj === undefined)
                return obj; // revisit when spec is updated

            return new Promise((resolve, reject) => {
                let keys = Object.getOwnPropertyNames(obj);
                const result = Object.create(obj.constructor?.prototype);
                let count = 0;
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                    if (descriptor.get || descriptor.set) {
                        Object.defineProperty(result, key, descriptor);
                        count++;
                    } else {
                        Promise.resolve(obj[key]).then((value) => {
                            Object.defineProperty(result, key, {
                                value: value,
                                configurable: true,
                                enumerable: true,
                                writable: true,
                            });
                            if (++count === keys.length)
                                resolve(result);
                        }, reject);
                    }
                }
                if (count === keys.length)
                    resolve(result);
            });
        }

        Object.defineProperty(Promise, "ownProperties", {
            value: ownProperties,
            configurable: true,
            enumerable: false,
            writable: true,
        });
    }

    if (!Promise.fromEntries) {
        function fromEntries(entries) {
            if (!Array.isArray(entries))
                throw new TypeError("Array expected");

            return new Promise((resolve, reject) => {
                const result = {};
                let count = 0;
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    Promise.resolve(entry[1]).then((value) => {
                        result[entry[0]] = value;
                        if (++count === entries.length)
                            resolve(result);
                    }, reject);
                }
            });
        }

        Object.defineProperty(Promise, "fromEntries", {
            value: fromEntries,
            configurable: true,
            enumerable: false,
            writable: true,
        });
    }
})();
