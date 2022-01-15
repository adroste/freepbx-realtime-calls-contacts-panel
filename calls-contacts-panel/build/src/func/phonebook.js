"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntry = exports.updateEntry = exports.deleteEntry = exports.offPhonebookChange = exports.onPhonebookChange = exports.stopMonitorPhonebook = exports.monitorPhonebook = exports.getPhonebook = exports.updatePhonebook = exports.GROUP_TYPES = exports.PHONE_NUMBER_TYPES = void 0;
const tslib_1 = require("tslib");
const events_1 = require("events");
const config_1 = require("../config");
const database_1 = require("../database");
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const TAG = '[Phonebook Monitor]';
const phonebookMonitor = new events_1.EventEmitter();
let checkInterval;
let phonebook = [];
exports.PHONE_NUMBER_TYPES = ['cell', 'work', 'internal', 'home', 'other'];
exports.GROUP_TYPES = ['internal', 'external', 'private'];
function getCombinedName(entry) {
    const format = 'FirstNameLastName';
    if (entry.displayname)
        return entry.displayname;
    const fname = `${entry.title || ''} ${entry.fname || ''}`.trim();
    const lname = (entry.lname || '').trim();
    if (fname && lname) {
        if (format === 'FirstNameLastName')
            return `${fname} ${lname}`;
        else
            return `${lname}, ${fname}`;
    }
    return fname || lname;
}
function queryPhonebook() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const [groupEntries] = yield (0, database_1.getDb)().query(`
SELECT e.id, e.displayname, e.fname, e.lname, e.title, e.company, e.address, e.uuid, e.groupid,
	g.name AS groupname, g.type AS grouptype, g.owner AS groupowner
FROM contactmanager_group_entries e 
LEFT JOIN contactmanager_groups g
	ON e.groupid = g.id
  `);
        const [emails] = yield (0, database_1.getDb)().query(`
SELECT e.id, m.email
FROM contactmanager_group_entries e 
JOIN contactmanager_entry_emails m
	ON e.id = m.entryid
  `);
        const [numbers] = yield (0, database_1.getDb)().query(`
SELECT e.id, n.number, n.type, n.stripped, n.flags
FROM contactmanager_group_entries e 
JOIN contactmanager_entry_numbers n 
  ON n.entryid = e.id
  `);
        const [websites] = yield (0, database_1.getDb)().query(`
SELECT e.id, w.website
FROM contactmanager_group_entries e 
JOIN contactmanager_entry_websites w
  ON e.id = w.entryid
  `);
        function mapById(arr) {
            return arr.reduce((byId, o) => {
                if (byId[o.id])
                    byId[o.id].push(o);
                else
                    byId[o.id] = [o];
                return byId;
            }, {});
        }
        const emailsById = mapById(emails);
        const numbersById = mapById(numbers);
        const websitesById = mapById(websites);
        const entries = groupEntries.map(e => {
            var _a, _b, _c;
            const numbers = [];
            (_a = numbersById[e.id]) === null || _a === void 0 ? void 0 : _a.forEach(({ number, type, flags }) => {
                if (number && type)
                    numbers.push({
                        number,
                        type,
                        flags: (flags === null || flags === void 0 ? void 0 : flags.split('|').filter(x => x)) || []
                    });
            });
            const emails = (_b = emailsById[e.id]) === null || _b === void 0 ? void 0 : _b.map(email => email.email).filter(x => x);
            const websites = (_c = websitesById[e.id]) === null || _c === void 0 ? void 0 : _c.map(website => website.website).filter(x => x);
            return {
                id: e.id,
                uuid: e.uuid,
                groupId: e.groupid,
                groupName: e.groupname,
                groupType: e.grouptype,
                groupOwner: e.groupowner === -1 ? undefined : e.groupowner,
                combinedName: getCombinedName(e),
                displayName: e.displayname,
                firstName: e.fname,
                lastName: e.lname,
                company: e.company,
                title: e.title,
                address: e.address,
                numbers,
                emails,
                websites,
            };
        });
        return entries.sort((a, b) => a.combinedName.localeCompare(b.combinedName));
    });
}
function updatePhonebook() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const nextPhonebook = yield queryPhonebook();
        if ((0, lodash_1.isEqual)(nextPhonebook, phonebook))
            return;
        phonebook = nextPhonebook;
        phonebookMonitor.emit('phonebook', phonebook);
    });
}
exports.updatePhonebook = updatePhonebook;
function getPhonebook() {
    return phonebook;
}
exports.getPhonebook = getPhonebook;
function monitorPhonebook() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield updatePhonebook();
        checkInterval = setInterval(updatePhonebook, (0, config_1.getConfig)().phonebookCheckIntervalMs);
        console.log(TAG, 'started');
    });
}
exports.monitorPhonebook = monitorPhonebook;
function stopMonitorPhonebook() {
    clearInterval(checkInterval);
    console.log(TAG, 'stopped');
}
exports.stopMonitorPhonebook = stopMonitorPhonebook;
function onPhonebookChange(listener) {
    phonebookMonitor.on('phonebook', listener);
}
exports.onPhonebookChange = onPhonebookChange;
function offPhonebookChange(listener) {
    phonebookMonitor.off('phonebook', listener);
}
exports.offPhonebookChange = offPhonebookChange;
function isEntryUpdateAllowed(id) {
    var _a;
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        ;
        const [res] = yield (0, database_1.getDb)().query(`
SELECT g.type
FROM contactmanager_group_entries e
JOIN contactmanager_groups g
	ON e.groupid = g.id
WHERE e.id = ?
  `, [id]);
        const type = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.type;
        return type === 'external' || type === 'private';
    });
}
function checkGroupExists(groupId) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        if (typeof groupId !== 'number')
            return false;
        const [res] = yield (0, database_1.getDb)().query('SELECT id FROM contactmanager_groups WHERE id = ?', [groupId]);
        return Array.isArray(res) && !!(res === null || res === void 0 ? void 0 : res.length);
    });
}
function checkNumbersAreWritable(numbers) {
    if (!numbers || !Array.isArray(numbers))
        return false;
    const acceptedTypes = exports.PHONE_NUMBER_TYPES.filter(t => t !== 'internal');
    for (const n of numbers) {
        if (!n
            || !n.number
            || typeof n.number !== 'string'
            || !n.type
            || !acceptedTypes.includes(n.type)
            || !Array.isArray(n.flags)
            || n.flags.some((v) => v !== 'sms' && v !== 'fax')) {
            return false;
        }
    }
    return true;
}
function deleteEntryEmails(id) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield (0, database_1.getDb)().query(`
DELETE FROM contactmanager_entry_emails
WHERE entryid = ?
  `, [id]);
    });
}
function deleteEntryNumbers(id) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield (0, database_1.getDb)().query(`
DELETE FROM contactmanager_entry_numbers
WHERE entryid = ?
  `, [id]);
    });
}
function deleteEntryImages(id) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield (0, database_1.getDb)().query(`
DELETE FROM contactmanager_entry_images
WHERE entryid = ?
  `, [id]);
    });
}
function deleteEntrySpeedDials(id) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield (0, database_1.getDb)().query(`
DELETE FROM contactmanager_entry_speeddials
WHERE entryid = ?
  `, [id]);
    });
}
function deleteEntryWebsites(id) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield (0, database_1.getDb)().query(`
DELETE FROM contactmanager_entry_websites
WHERE entryid = ?
  `, [id]);
    });
}
function deleteEntryXmpps(id) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield (0, database_1.getDb)().query(`
DELETE FROM contactmanager_entry_xmpps
WHERE entryid = ?
  `, [id]);
    });
}
function deleteEntry(id) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        if (typeof id !== 'number' || !(yield isEntryUpdateAllowed(id)))
            return false;
        try {
            yield deleteEntryEmails(id);
            yield deleteEntryNumbers(id);
            yield deleteEntryImages(id);
            yield deleteEntrySpeedDials(id);
            yield deleteEntryWebsites(id);
            yield deleteEntryXmpps(id);
            yield (0, database_1.getDb)().query(`
DELETE FROM contactmanager_group_entries
WHERE id = ?
    `, [id]);
            return true;
        }
        catch (err) {
            console.error(err);
            return false;
        }
        finally {
            updatePhonebook();
        }
    });
}
exports.deleteEntry = deleteEntry;
function insertEntryEmails(id, emails) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const values = emails
            .filter(email => email.trim())
            .map(email => [id, email.trim()]);
        if (!values.length)
            return;
        yield (0, database_1.getDb)().query(`
INSERT INTO contactmanager_entry_emails (entryid, email)
VALUES ?
  `, [values]);
    });
}
function insertEntryNumbers(id, numbers) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const values = numbers
            .filter(nr => nr.number.trim())
            .map(nr => [
            id,
            nr.number.trim(),
            '',
            nr.type,
            nr.flags.filter(f => ['sms', 'fax'].includes(f)).join('|'),
            null,
            null,
            null,
            null,
            nr.number.trim().replace(/[^0-9*#]/, ''),
            '',
            null,
        ]);
        if (!values.length)
            return;
        yield (0, database_1.getDb)().query(`
INSERT INTO contactmanager_entry_numbers (entryid, number, extension, type, flags, countrycode, nationalnumber, E164, regioncode, stripped, locale, possibleshort) 
VALUES ?
  `, [values]);
    });
}
function insertEntryWebsites(id, websites) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const values = websites
            .filter(website => website.trim())
            .map(website => [id, website.trim()]);
        if (!values.length)
            return;
        yield (0, database_1.getDb)().query(`
INSERT INTO contactmanager_entry_websites (entryid, website)
VALUES ?
  `, [values]);
    });
}
function updateEntry(id, entry) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        if (typeof id !== 'number'
            || !(yield isEntryUpdateAllowed(id))
            || !((_a = entry === null || entry === void 0 ? void 0 : entry.numbers) === null || _a === void 0 ? void 0 : _a.length)
            || !checkNumbersAreWritable(entry.numbers)
            || !(yield checkGroupExists(entry.groupId))) {
            console.dir(entry);
            return false;
        }
        try {
            yield deleteEntryEmails(id);
            if ((_b = entry.emails) === null || _b === void 0 ? void 0 : _b.length)
                yield insertEntryEmails(id, entry.emails);
            yield deleteEntryNumbers(id);
            yield insertEntryNumbers(id, entry.numbers);
            yield deleteEntryWebsites(id);
            if ((_c = entry.websites) === null || _c === void 0 ? void 0 : _c.length)
                yield insertEntryWebsites(id, entry.websites);
            yield (0, database_1.getDb)().query(`
UPDATE contactmanager_group_entries 
SET groupid = ?, displayname = ?, fname = ?, lname = ?, title = ?, company = ?, address = ? 
WHERE id = ?
    `, [
                entry.groupId,
                ((_d = entry.displayName) === null || _d === void 0 ? void 0 : _d.trim()) || '',
                ((_e = entry.firstName) === null || _e === void 0 ? void 0 : _e.trim()) || '',
                ((_f = entry.lastName) === null || _f === void 0 ? void 0 : _f.trim()) || '',
                ((_g = entry.title) === null || _g === void 0 ? void 0 : _g.trim()) || '',
                ((_h = entry.company) === null || _h === void 0 ? void 0 : _h.trim()) || '',
                ((_j = entry.address) === null || _j === void 0 ? void 0 : _j.trim()) || '',
                id
            ]);
            return true;
        }
        catch (err) {
            console.error(err);
            return false;
        }
        finally {
            updatePhonebook();
        }
    });
}
exports.updateEntry = updateEntry;
function createEntry(entry) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        if (!((_a = entry === null || entry === void 0 ? void 0 : entry.numbers) === null || _a === void 0 ? void 0 : _a.length)
            || !checkNumbersAreWritable(entry.numbers)
            || !(yield checkGroupExists(entry.groupId))) {
            return -1;
        }
        try {
            const [res] = yield (0, database_1.getDb)().query(`
INSERT INTO contactmanager_group_entries (groupid, user, displayname, fname, lname, title, company, address, uuid) 
VALUES (?)
    `, [[
                    entry.groupId,
                    -1,
                    ((_b = entry.displayName) === null || _b === void 0 ? void 0 : _b.trim()) || '',
                    ((_c = entry.firstName) === null || _c === void 0 ? void 0 : _c.trim()) || '',
                    ((_d = entry.lastName) === null || _d === void 0 ? void 0 : _d.trim()) || '',
                    ((_e = entry.title) === null || _e === void 0 ? void 0 : _e.trim()) || '',
                    ((_f = entry.company) === null || _f === void 0 ? void 0 : _f.trim()) || '',
                    ((_g = entry.address) === null || _g === void 0 ? void 0 : _g.trim()) || '',
                    (0, uuid_1.v1)()
                ]]);
            const id = res.insertId;
            yield insertEntryNumbers(id, entry.numbers);
            if ((_h = entry.emails) === null || _h === void 0 ? void 0 : _h.length)
                yield insertEntryEmails(id, entry.emails);
            if ((_j = entry.websites) === null || _j === void 0 ? void 0 : _j.length)
                yield insertEntryWebsites(id, entry.websites);
            return id;
        }
        catch (err) {
            console.error(err);
            return -1;
        }
        finally {
            updatePhonebook();
        }
    });
}
exports.createEntry = createEntry;
//# sourceMappingURL=phonebook.js.map