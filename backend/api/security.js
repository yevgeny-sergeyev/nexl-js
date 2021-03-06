const uuidv4 = require('uuid/v4');
const base64 = require('base-64');

const confMgmt = require('./conf-mgmt');
const confConsts = require('../common/conf-constants');
const securityConsts = require('../common/security-constants');
const bcrypt = require('./bcryptx');
const logger = require('./logger');
const ldapUtils = require('./ldap-utils');

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const READ_PERMISSION = 'read';
const WRITE_PERMISSION = 'write';

const REGISTRATION_TOKEN_EXPIRATION_HOURS = 24;
const LOGIN_TOKENS_MAP = {};
const LOGIN_TOKEN = 'loginToken';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////


function sendError(res, msg, httpStatus) {
	httpStatus = httpStatus ? httpStatus : 500;
	res.statusMessage = msg;
	res.status(httpStatus).send(msg).end();
}

function isAdminInner(user) {
	return confMgmt.getCached(confConsts.CONF_FILES.ADMINS).indexOf(user) >= 0;
}

function isAdmin(user) {
	const loggedInUsername = (user === securityConsts.GUEST_USER) ? securityConsts.GUEST_USER : securityConsts.AUTHENTICATED;
	return isAdminInner(securityConsts.GUEST_USER) || isAdminInner(loggedInUsername) || isAdminInner(user);
}

function retrievePermission(permission, type) {
	if (permission === undefined) {
		return false;
	}

	const result = permission[type];
	if (result === undefined) {
		return false;
	}

	return result;
}

// type is a permission type ( for example 'read' | 'write' )
// value is the expected value to check
function hasPermission(user, type) {
	if (isAdmin(user)) {
		return true;
	}

	const permissions = confMgmt.getCached(confConsts.CONF_FILES.PERMISSIONS);

	// permission for [guest] user
	const guestUserPermission = permissions[securityConsts.GUEST_USER];

	// permissions for [loggedin] user
	let loggedInUserPermission = (user === securityConsts.GUEST_USER) ? permissions[securityConsts.GUEST_USER] : permissions[securityConsts.AUTHENTICATED];

	// permissions for [user]
	const userPermission = permissions[user];

	// summarizing all permissions
	return retrievePermission(guestUserPermission, type) || retrievePermission(loggedInUserPermission, type) || retrievePermission(userPermission, type);
}

function hasReadPermission(user) {
	return hasPermission(user, READ_PERMISSION);
}

function hasWritePermission(user) {
	return hasPermission(user, WRITE_PERMISSION);
}

function status(user) {
	return {
		isAdmin: isAdmin(user),
		hasReadPermission: isAdmin(user) || hasReadPermission(user),
		hasWritePermission: isAdmin(user) || hasWritePermission(user)
	};
}


function resetPassword(username, password, token) {
	let users = confMgmt.getCached(confConsts.CONF_FILES.USERS);
	const userObj = users[username];

	// is user exists ? || is not same token ?
	if (userObj === undefined || userObj.token2ResetPassword === undefined || userObj.token2ResetPassword.token !== token.trim()) {
		return Promise.reject('Bad token');
	}

	// is token expired ?
	let tokenCreated = Date.parse(userObj.token2ResetPassword.created);
	if (tokenCreated !== tokenCreated) { // is NaN ?
		return Promise.reject(`Failed to parse token creation date [${userObj.token2ResetPassword.created}] for [${username}] user`);
	}

	if (tokenCreated + REGISTRATION_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000 < new Date().getTime()) {
		return Promise.reject('Token expired !');
	}

	// token is applied, removing it
	delete userObj.token2ResetPassword.created;
	delete userObj.token2ResetPassword.token;

	// generating new hash for password
	return bcrypt.hash(password)
		.then((hash) => {
			userObj.password = hash;
			return confMgmt.save(users, confConsts.CONF_FILES.USERS);
		});
}

function changePassword(username, currentPassword, newPassword) {
	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);
	const user = users[username];
	if (user === undefined) {
		return Promise.reject(`Change password action is rejected because the [${username}] user doesn't exist`);
	}

	// checking for existing password
	return bcrypt.compare(currentPassword, user.password)
		.then((isValid) => {
			if (!isValid) {
				return Promise.reject(`Change password action is rejected. Reason : bad existing password for [${username}] user`);
			}

			// creating new hash
			return bcrypt.hash(newPassword)
				.then((hash) => {
					user.password = hash;
					return confMgmt.save(users, confConsts.CONF_FILES.USERS);
				});
		});
}

function isPasswordValid(username, password) {
	const users = confMgmt.getCached(confConsts.CONF_FILES.USERS);
	const user = users[username];

	// is user present in password.js file ?
	if (user !== undefined && user.disabled !== true) {
		logger.log.debug(`The [${username}] user is a nexl internal user. Validating password`);
		if (user.password === undefined) {
			return Promise.reject('Bad credentials');
		}
		return bcrypt.compare(password, user.password);
	}

	// no LDAP ? good bye
	const ldapSettings = confMgmt.getLDAPSettings();
	if (ldapSettings === undefined) {
		return Promise.resolve(false);
	}

	logger.log.debug('The [%s] user is not present in nexl internal directory. Trying to authenticate via LDAP', username);

	const opts = {
		ldap: ldapSettings,
		username: username,
		password: password
	};

	return ldapUtils(opts).then(
		_ => Promise.resolve(true)
	).catch(
		_ => Promise.resolve(false)
	);
}

function handleBasicAuthorization(req) {
	const authorization = req.headers.authorization;
	if (authorization === undefined) {
		return Promise.resolve()
	}

	logger.log.debug('Trying to authorize user via Basic Authorization');
	let credentials;
	try {
		credentials = base64.decode(authorization.substr(6));
	} catch (e) {
		logger.log.error('Failed to decode Basic Authorization hash');
		return Promise.resolve()
	}

	const username = credentials.substr(0, credentials.indexOf(':'));
	const password = credentials.substr(credentials.indexOf(':') + 1);

	logger.log.debug(`Got a [${username}] username from Basic Authorization. Validating user credentials`);
	return isPasswordValid(username, password)
		.then(isValid => {

			if (isValid) {
				req.username = username;
			}
			return Promise.resolve();
		});
}

function getSessionTimeout() {
	return confMgmt.getNexlSettingsCached()[confConsts.SETTINGS.SESSION_TIMEOUT] * 60 * 1000;
}

function handleCookiesAuthorization(req, res) {
	if (req.username !== undefined) {
		return Promise.resolve();
	}

	const loginToken = req.cookies[LOGIN_TOKEN];

	// no cookies set ? apply guest user
	if (loginToken === undefined) {
		req.username = securityConsts.GUEST_USER;
		return Promise.resolve();
	}

	// does client login token match server token ?
	const authItem = LOGIN_TOKENS_MAP[loginToken];
	if (authItem === undefined) {
		res.clearCookie(LOGIN_TOKEN);
		req.username = securityConsts.GUEST_USER;
		return Promise.resolve();
	}

	// is expired ?
	if (authItem.sessionExpiresAt < new Date().getTime()) {
		logger.log.log('verbose', `Session expired for [${authItem.username}] user`);
		res.clearCookie(LOGIN_TOKEN);
		delete LOGIN_TOKENS_MAP[loginToken];
		req.username = securityConsts.GUEST_USER;
		return Promise.resolve();
	}

	// updating session expiration date
	LOGIN_TOKENS_MAP[loginToken].sessionExpiresAt = new Date().getTime() + getSessionTimeout();

	// updating cookies expiration date
	res.cookie(LOGIN_TOKEN, loginToken, {
		maxAge: getSessionTimeout(),
		httpOnly: true
	});

	req.username = authItem.username;
	return Promise.resolve();
}

function authInterceptor(req, res, next) {
	Promise.resolve()
		.then(_ => handleBasicAuthorization(req))
		.then(_ => handleCookiesAuthorization(req, res))
		.then(_ => {
			next();
		});
}

function login(username, res) {
	const loginToken = uuidv4();

	res.cookie(LOGIN_TOKEN, loginToken, {
		maxAge: getSessionTimeout(),
		httpOnly: true
	});


	LOGIN_TOKENS_MAP[loginToken] = {
		sessionExpiresAt: new Date().getTime() + getSessionTimeout(),
		username: username
	}
}

function logout(req, res) {
	const loginToken = req.cookies[LOGIN_TOKEN];

	if (loginToken !== undefined) {
		delete LOGIN_TOKENS_MAP[loginToken];
		res.clearCookie(LOGIN_TOKEN);
	}
}

function getLoggedInUsername(req) {
	return req.username;
}

// --------------------------------------------------------------------------------
module.exports.TOKEN_VALID_HOURS = REGISTRATION_TOKEN_EXPIRATION_HOURS;

module.exports.sendError = sendError;

module.exports.isAdmin = isAdmin;
module.exports.hasReadPermission = hasReadPermission;
module.exports.hasWritePermission = hasWritePermission;
module.exports.status = status;

module.exports.resetPassword = resetPassword;
module.exports.changePassword = changePassword;
module.exports.isPasswordValid = isPasswordValid;
module.exports.login = login;
module.exports.logout = logout;
module.exports.getLoggedInUsername = getLoggedInUsername;

module.exports.authInterceptor = authInterceptor;
// --------------------------------------------------------------------------------
