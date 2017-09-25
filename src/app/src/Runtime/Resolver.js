import path from 'path'

class Resolver {
  /**
  * @param name: the name of the file in the content scene
  * @return the full path to the file
  */
  static contentScene (name) {
    return path.resolve(path.join(__dirname, '../scenes/content/', name))
  }

  /**
  * @param name: the name of the file in the mailboxes scene
  * @return the full path to the file
  */
  static mailboxesScene (name) {
    return path.resolve(path.join(__dirname, '../scenes/mailboxes/', name))
  }

  /**
  * @param name: the name of the file in the monitor scene
  * @return the full path to the file
  */
  static monitorScene (name) {
    return path.resolve(path.join(__dirname, '../scenes/monitor/', name))
  }

  /**
  * @param name: the name of the file in the guest preload repo
  * @return the full path to the file
  */
  static guestPreload (name) {
    return path.resolve(path.join(__dirname, '../guest/guest/preload/', name))
  }

  /**
  * @param name: the name of the file in the guest api repo
  * @return the full path to the file
  */
  static guestApi (name) {
    return path.resolve(path.join(__dirname, '../guestApi/', name))
  }

  /**
  * @param name: the name of the icon file
  * @return the full path to the file
  */
  static icon (name) {
    return path.resolve(path.join(__dirname, '../icons/', name))
  }
}

export default Resolver
