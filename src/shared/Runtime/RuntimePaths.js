const LanguageSettings = require('../Models/Settings/LanguageSettings')

module.exports = function (pkg, path, AppDirectory) {
  const appDirectory = new AppDirectory({
    appName: pkg.name,
    useRoaming: true
  })

  return {
    // Databases
    APP_DATA_PATH: appDirectory.userData(),
    DB_DIR_PATH: appDirectory.userData(),
    CUSTOM_CERTIFICATE_PATH: path.join(appDirectory.userData(), 'custom_certificates'),

    // Metrics
    METRICS_LOG_PATH: path.join(appDirectory.userData(), 'metrics.log'),

    // Notifications
    NOTIFICATION_PERMISSION_PATH: path.join(appDirectory.userData(), 'notification_permissions.records'),

    // Dictionaries
    USER_DICTIONARIES_PATH: LanguageSettings.userDictionariesPath(appDirectory.userData()),
    USER_DICTIONARY_WORDS_PATH: path.join(appDirectory.userData(), 'user_dictionary_words.records'),

    // Extensions
    USER_EXTENSION_INSTALL_PATH: path.join(appDirectory.userData(), 'user_extensions'),
    CHROME_EXTENSION_INSTALL_PATH: path.join(appDirectory.userData(), 'extensions/chrome'),
    CHROME_EXTENSION_DOWNLOAD_PATH: path.join(appDirectory.userData(), 'extensions/chromedownload')
  }
}
