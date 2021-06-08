import PropTypes from 'prop-types'
import React from 'react'
import { accountStore, accountActions } from 'stores/account'
import shallowCompare from 'react-addons-shallow-compare'
import SidelistMailboxContainer from './SidelistCommon/SidelistMailboxContainer'
import SidelistMailboxTooltip from './SidelistCommon/SidelistMailboxTooltip'
import SidelistServiceTooltip from './SidelistCommon/SidelistServiceTooltip'
import MailboxAndServiceContextMenu from 'Components/MailboxAndServiceContextMenu'
import ErrorBoundary from 'wbui/ErrorBoundary'
import ServiceTabs from 'Components/ServiceTabs'
import ACMailbox from 'shared/Models/ACAccounts/ACMailbox'
import Tappable from 'react-tappable/lib/Tappable'
import SidelistTLMailboxAvatar from './SidelistCommon/SidelistTLMailboxAvatar'
import SidelistTLServiceAvatar from './SidelistCommon/SidelistTLServiceAvatar'

class SidelistItemMultiService extends React.Component {
  /* **************************************************************************/
  // Class
  /* **************************************************************************/

  static propTypes = {
    mailboxId: PropTypes.string.isRequired,
    sidebarSize: PropTypes.string.isRequired,
    sortableGetScrollContainer: PropTypes.func.isRequired
  }

  /* **************************************************************************/
  // Component Lifecycle
  /* **************************************************************************/

  componentDidMount () {
    accountStore.listen(this.accountChanged)
    this.popoverCustomizeClearTO = null
  }

  componentWillUnmount () {
    accountStore.unlisten(this.accountChanged)
    clearTimeout(this.popoverCustomizeClearTO)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.mailboxId !== nextProps.mailboxId) {
      this.setState(this.generateAccountState(nextProps.mailboxId, accountStore.getState()))
    }
  }

  /* **************************************************************************/
  // Data lifecycle
  /* **************************************************************************/

  state = (() => {
    return {
      isHoveringGroup: false,
      popover: false,
      popoverAnchor: null,
      popoverMailboxId: undefined,
      popoverServiceId: undefined,
      ...this.generateAccountState(this.props.mailboxId, accountStore.getState())
    }
  })()

  accountChanged = (accountState) => {
    this.setState(this.generateAccountState(this.props.mailboxId, accountState))
  }

  /**
  * @param mailboxId: the id of the mailbox
  * @param accountState: the current account store state
  * @return state for this object based on accounts
  */
  generateAccountState (mailboxId, accountState) {
    const mailbox = accountState.getMailbox(mailboxId)
    if (mailbox) {
      return {
        hasMembers: true,
        isMailboxActive: accountState.activeMailboxId() === mailboxId,
        prioritizeFirstSidebarService: mailbox.sidebarFirstServicePriority !== ACMailbox.SIDEBAR_FIRST_SERVICE_PRIORITY.NORMAL,
        sidebarServicesCount: mailbox.sidebarServices.length,
        extraContextServiceId: mailbox.sidebarFirstServicePriority !== ACMailbox.SIDEBAR_FIRST_SERVICE_PRIORITY.NORMAL && mailbox.sidebarServices.length
          ? mailbox.sidebarServices[0]
          : undefined,
        renderAsServiceId: mailbox.sidebarFirstServicePriority === ACMailbox.SIDEBAR_FIRST_SERVICE_PRIORITY.PRIMARY && mailbox.sidebarServices.length
          ? mailbox.sidebarServices[0]
          : undefined
      }
    } else {
      return {
        hasMembers: false
      }
    }
  }

  /* **************************************************************************/
  // User Interaction
  /* **************************************************************************/

  /**
  * Handles the item being clicked on
  * @param evt: the event that fired
  */
  handleClick = (evt) => {
    const { mailboxId } = this.props
    const { prioritizeFirstSidebarService, sidebarServicesCount } = this.state
    if (evt.metaKey) {
      window.location.hash = `/settings/accounts/${mailboxId}`
    } else {
      if (prioritizeFirstSidebarService && sidebarServicesCount) {
        accountActions.changeActiveMailbox(mailboxId, true)
      } else {
        accountActions.changeActiveMailbox(mailboxId)
      }
    }
  }

  /**
  * Handles the item being long clicked on
  * @param evt: the event that fired
  */
  handleLongClick = (evt) => {
    accountActions.changeActiveMailbox(this.props.mailboxId, true)
  }

  /**
  * Handles a service being clicked
  * @param evt: the event that fired
  * @param serviceId: the id of the service
  */
  handleClickService = (evt, serviceId) => {
    evt.preventDefault()
    accountActions.changeActiveService(serviceId)
  }

  /**
  * Opens the popover
  * @param evt: the event that fired
  */
  handleOpenMailboxPopover = (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    clearTimeout(this.popoverCustomizeClearTO)
    this.setState({
      isHoveringGroup: false,
      popover: true,
      popoverMailboxId: this.props.mailboxId,
      popoverServiceId: undefined,
      popoverAnchor: evt.currentTarget
    })
  }

  /**
  * Opens the popover for a prioritized service
  * @param evt: the event that fired
  */
  handleOpenPrioritizedServicePopover = (evt) => {
    this.handleOpenServicePopover(evt, this.state.extraContextServiceId)
  }

  /**
  * Opens the popover for a service
  * @param evt: the event that fired
  * @param serviceId: the id of the service to open for
  */
  handleOpenServicePopover = (evt, serviceId) => {
    evt.preventDefault()
    evt.stopPropagation()
    clearTimeout(this.popoverCustomizeClearTO)
    this.setState({
      isHoveringGroup: false,
      popover: true,
      popoverMailboxId: this.props.mailboxId,
      popoverServiceId: serviceId,
      popoverAnchor: evt.currentTarget
    })
  }

  handleClosePopover = () => {
    clearTimeout(this.popoverCustomizeClearTO)
    this.popoverCustomizeClearTO = setTimeout(() => {
      this.setState({
        popoverMailboxId: undefined,
        popoverServiceId: undefined
      })
    }, 500)
    this.setState({ popover: false })
  }

  /* **************************************************************************/
  // Rendering
  /* **************************************************************************/

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  render () {
    const {
      mailboxId,
      sidebarSize,
      sortableGetScrollContainer,
      ...passProps
    } = this.props
    const {
      isHoveringGroup,
      popover,
      popoverAnchor,
      popoverMailboxId,
      popoverServiceId,
      hasMembers,
      renderAsServiceId,
      extraContextServiceId,
      isMailboxActive
    } = this.state
    if (!hasMembers) { return false }

    const TooltipClass = extraContextServiceId
      ? SidelistServiceTooltip
      : SidelistMailboxTooltip
    const tooltipProps = extraContextServiceId
      ? { mailboxId: mailboxId, serviceId: extraContextServiceId }
      : { mailboxId: mailboxId }

    return (
      <SidelistMailboxContainer
        onMouseEnter={() => this.setState({ isHoveringGroup: true })}
        onMouseLeave={() => this.setState({ isHoveringGroup: false })}
        {...passProps}>
        <TooltipClass {...tooltipProps}>
          <Tappable
            onClick={this.handleClick}
            onPress={this.handleLongClick}
            onContextMenu={(extraContextServiceId
              ? this.handleOpenPrioritizedServicePopover
              : this.handleOpenMailboxPopover
            )}>
            {renderAsServiceId ? (
              <SidelistTLServiceAvatar
                mailboxId={mailboxId}
                serviceId={renderAsServiceId}
                sidebarSize={sidebarSize}
                isTransientActive={isHoveringGroup}
                forceIndicator={isMailboxActive} />
            ) : (
              <SidelistTLMailboxAvatar
                mailboxId={mailboxId}
                sidebarSize={sidebarSize}
                isTransientActive={isHoveringGroup}
                forceIndicator={isMailboxActive} />
            )}
          </Tappable>
        </TooltipClass>
        <ServiceTabs
          mailboxId={mailboxId}
          uiLocation={ACMailbox.SERVICE_UI_LOCATIONS.SIDEBAR}
          sidebarSize={sidebarSize}
          onOpenService={this.handleClickService}
          sortableGetScrollContainer={sortableGetScrollContainer}
          onContextMenuService={this.handleOpenServicePopover} />
        {popoverMailboxId || popoverServiceId ? (
          <ErrorBoundary>
            <MailboxAndServiceContextMenu
              mailboxId={popoverMailboxId}
              serviceId={popoverServiceId}
              isOpen={popover}
              anchor={popoverAnchor}
              onRequestClose={this.handleClosePopover} />
          </ErrorBoundary>
        ) : undefined}
      </SidelistMailboxContainer>
    )
  }
}

export default SidelistItemMultiService
