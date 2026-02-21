const fs = require('fs');
const path = require('path');

function simpleId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

class JsonModel {
    constructor(modelName) {
        this.modelName = modelName;
        this.filePath = path.join(__dirname, `../data/${modelName.toLowerCase()}s.json`);
        this._ensureDir();
    }

    _ensureDir() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, '[]');
    }

    _read() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (e) { return []; }
    }

    _write(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    _matches(item, query) {
        if (!query || Object.keys(query).length === 0) return true;

        for (let key in query) {
            const val = query[key];

            // $or support
            if (key === '$or' && Array.isArray(val)) {
                if (!val.some(subQuery => this._matches(item, subQuery))) return false;
                continue;
            }

            // Normal field filters
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                // Operators: $nin, $gte, $lt
                if ('$nin' in val && val.$nin.includes(item[key])) return false;
                if ('$gte' in val && !(item[key] >= val.$gte)) return false;
                if ('$lt' in val && !(item[key] < val.$lt)) return false;
                if ('$in' in val && !val.$in.includes(item[key])) return false;
                if ('$ne' in val && item[key] === val.$ne) return false;
            } else {
                if (item[key] !== val) return false;
            }
        }
        return true;
    }

    _wrap(item) {
        if (!item) return null;
        const self = this;
        const wrapped = {
            ...item,
            toObject: function () {
                const obj = { ...this };
                delete obj.toObject;
                delete obj.save;
                delete obj.deleteOne;
                delete obj.select;
                delete obj.sort;
                delete obj.populate;
                delete obj.limit;
                return obj;
            },
            save: async function () {
                const items = self._read();
                const idx = items.findIndex(i => i._id === this._id);
                if (idx !== -1) {
                    const toSave = this.toObject();
                    items[idx] = { ...toSave, updatedAt: new Date() };
                    self._write(items);
                    return self._wrap(items[idx]);
                }
                return null;
            },
            deleteOne: async function () {
                return self.deleteOne({ _id: this._id });
            }
        };

        // Add chainable mocks
        wrapped.select = function () { return this; };
        wrapped.sort = function () { return this; };
        wrapped.populate = function () { return this; };
        wrapped.limit = function () { return this; };

        return wrapped;
    }

    find(query = {}) {
        const self = this;
        const queryObj = {
            _query: query,
            _sort: null,
            _limit: null,
            _select: null,
            _populate: null,

            sort(s) { this._sort = s; return this; },
            select(s) { this._select = s; return this; },
            limit(l) { this._limit = l; return this; },
            populate(p) { this._populate = p; return this; },

            // Make it thenable (awaitable)
            then(resolve, reject) {
                try {
                    const items = self._read();
                    let filtered = items.filter(item => self._matches(item, this._query));

                    // Real Sorting Logic
                    if (this._sort) {
                        const sortKeys = Object.keys(this._sort);
                        filtered.sort((a, b) => {
                            for (let key of sortKeys) {
                                const dir = this._sort[key];
                                if (a[key] < b[key]) return dir === -1 ? 1 : -1;
                                if (a[key] > b[key]) return dir === -1 ? -1 : 1;
                            }
                            return 0;
                        });
                    }

                    // Limit Logic
                    if (this._limit) {
                        filtered = filtered.slice(0, this._limit);
                    }

                    const wrappedArray = filtered.map(item => self._wrap(item));

                    // Add mocks to result array to prevent 'not a function' if results are chained again
                    wrappedArray.select = function () { return this; };
                    wrappedArray.sort = function () { return this; };
                    wrappedArray.populate = function () { return this; };
                    wrappedArray.limit = function () { return this; };

                    if (resolve) resolve(wrappedArray);
                } catch (e) {
                    if (reject) reject(e);
                    else throw e;
                }
            }
        };
        return queryObj;
    }

    async findOne(query = {}) {
        const items = this._read();
        const item = items.find(item => this._matches(item, query));
        return this._wrap(item);
    }

    async findById(id) { return this.findOne({ _id: id }); }

    async create(data) {
        const items = this._read();
        const newItem = { _id: simpleId(), createdAt: new Date(), updatedAt: new Date(), ...data };
        items.push(newItem);
        this._write(items);
        return this._wrap(newItem);
    }

    async countDocuments(query = {}) {
        const items = await this.find(query);
        return items.length;
    }

    async insertMany(arr) {
        const items = this._read();
        const wrapped = arr.map(data => ({
            _id: simpleId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data
        }));
        items.push(...wrapped);
        this._write(items);
        return wrapped.map(i => this._wrap(i));
    }

    async findByIdAndUpdate(id, update, options = {}) {
        const items = this._read();
        const idx = items.findIndex(i => i._id === id);
        if (idx === -1) return null;
        const updated = { ...items[idx], ...update, updatedAt: new Date() };
        items[idx] = updated;
        this._write(items);
        return this._wrap(updated);
    }

    async deleteOne(query) {
        let items = this._read();
        const initialLen = items.length;
        const toDelete = items.find(i => this._matches(i, query));
        if (toDelete) {
            items = items.filter(i => i._id !== toDelete._id);
            this._write(items);
        }
        return { deletedCount: initialLen - items.length };
    }

    async deleteMany(query = {}) {
        const items = this._read();
        const remaining = items.filter(i => !this._matches(i, query));
        const deletedCount = items.length - remaining.length;
        if (deletedCount > 0) {
            this._write(remaining);
        }
        return { deletedCount };
    }

    async findByIdAndDelete(id) { return this.deleteOne({ _id: id }); }
}

module.exports = JsonModel;
