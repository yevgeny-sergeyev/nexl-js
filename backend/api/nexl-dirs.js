const path = require('path');
const fs = require('fs');
const fsx = require('./fsx');
const util = require('util');

const utils = require('./utils');
const confMgmt = require('./conf-mgmt');
const security = require('./security');
const logger = require('./logger');

function isConfFileExists(fileName) {
	return fsx.join(confMgmt.getNexlHomeDir(), fileName).then(fsx.exists);
}

function initNexlHomeDir() {
	logger.log.debug('Creating default configuration files if absent in [%s] nexl home dir', confMgmt.getNexlHomeDir());
	const promises = [];

	// creating tokens file is not exists
	promises.push(isConfFileExists(confMgmt.CONF_FILES.TOKENS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one and generating token for [%s] user', confMgmt.CONF_FILES.TOKENS, confMgmt.getNexlHomeDir(), utils.ADMIN_USERNAME);
				logger.log.info('------> Use a token stored in [%s] file located in [%s] directory to register a [%s] account', confMgmt.CONF_FILES.TOKENS, confMgmt.getNexlHomeDir(), utils.ADMIN_USERNAME);
				return security.generateTokenAndSave(utils.ADMIN_USERNAME);
			}
		}
	));

	// creating admins file if not exists
	promises.push(isConfFileExists(confMgmt.CONF_FILES.ADMINS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a [%s] user', confMgmt.CONF_FILES.ADMINS, confMgmt.getNexlHomeDir(), utils.ADMIN_USERNAME);
				const admins = [utils.ADMIN_USERNAME];
				return confMgmt.save(admins, confMgmt.CONF_FILES.ADMINS);
			}
		}
	));

	// creating permissions file if not exists
	promises.push(isConfFileExists(confMgmt.CONF_FILES.PERMISSIONS).then(
		(isExists) => {
			if (!isExists) {
				logger.log.info('The [%s] file doesn\'t exist in [%s] directory. Creating a new one with a default permissions for [%s] user', confMgmt.CONF_FILES.PERMISSIONS, confMgmt.getNexlHomeDir(), utils.UNAUTHORIZED_USERNAME);
				const permission = {};
				permission[utils.UNAUTHORIZED_USERNAME] = {
					read: true,
					write: true
				};
				return confMgmt.save(permission, confMgmt.CONF_FILES.PERMISSIONS);
			}
		}
	));

	// creating settings file with defaults if not exists
	promises.push(isConfFileExists(confMgmt.CONF_FILES.SETTINGS).then(
		(isExists) => {
			if (isExists) {
				return Promise.resolve();
			}

			return confMgmt.loadSettings().then(
				(settings) => {
					return confMgmt.saveSettings(settings);
				});
		}
	));

	return Promise.all(promises);
}

function createNexlHomeDirectoryIfNeeded() {
	return fsx.exists(confMgmt.getNexlHomeDir()).then((isExists) => {
		if (isExists) {
			return fsx.stat(confMgmt.getNexlHomeDir()).then((stat) => {
				if (stat.isDirectory()) {
					logger.log.debug('The [%s] nexl home directory exists', confMgmt.getNexlHomeDir());
					return Promise.resolve();
				} else {
					logger.log.error('The [%s] nexl home directory points to existing file ( or something else ). Recreate it as a directory or use another nexl home directory in the following way :\nnexl --nexl-home=/path/to/nexl/home/directory', confMgmt.getNexlHomeDir());
					return Promise.reject('nexl home directory probably points to existing file or something else');
				}
			});
		} else {
			return fsx.mkdir(confMgmt.getNexlHomeDir()).then(() => {
				logger.log.info('The [%s] nexl home dir has been created', confMgmt.getNexlHomeDir());
				return Promise.resolve();
			});
		}
	});
}

// --------------------------------------------------------------------------------
module.exports.createNexlHomeDirectoryIfNeeded = createNexlHomeDirectoryIfNeeded;
module.exports.initNexlHomeDir = initNexlHomeDir;
// --------------------------------------------------------------------------------
