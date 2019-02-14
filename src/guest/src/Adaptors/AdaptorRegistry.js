import AsanaAdaptor from './Sites/AsanaAdaptor'
import FastmailAdaptor from './Sites/FastmailAdaptor'
import GmailGinboxAdaptor from './Sites/GmailGinboxAdaptor'
import GoogleAlloAdaptor from './Sites/GoogleAlloAdaptor'
import GoogleChatAdaptor from './Sites/GoogleChatAdaptor'
import GoogleDriveAdaptor from './Sites/GoogleDriveAdaptor'
import GoogleHangoutsAdaptor from './Sites/GoogleHangoutsAdaptor'
import OneDriveAdaptor from './Sites/OneDriveAdaptor'
import SkypeAdaptor from './Sites/SkypeAdaptor'
import SlackAdaptor from './Sites/SlackAdaptor'
import TrelloAdaptor from './Sites/TrelloAdaptor'

const registry = [
  AsanaAdaptor,
  FastmailAdaptor,
  GmailGinboxAdaptor,
  GoogleAlloAdaptor,
  GoogleChatAdaptor,
  GoogleDriveAdaptor,
  GoogleHangoutsAdaptor,
  OneDriveAdaptor,
  SkypeAdaptor,
  SlackAdaptor,
  TrelloAdaptor
]

export default registry
