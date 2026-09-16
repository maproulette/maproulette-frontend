import _filter from "lodash/filter";
import _map from "lodash/map";
import _without from "lodash/without";
import { Component, Fragment } from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import AsAvatarUser from "../../../../../interactions/User/AsAvatarUser";
import AsManager from "../../../../../interactions/User/AsManager";
import { Role, messagesByRole, mostPrivilegedRole } from "../../../../../services/Grant/Role";
import { WidgetDataTarget, registerWidgetType } from "../../../../../services/Widget/Widget";
import AutosuggestTextBox from "../../../../AutosuggestTextBox/AutosuggestTextBox";
import BusySpinner from "../../../../BusySpinner/BusySpinner";
import WithOSMUserSearch from "../../../../HOCs/WithOSMUserSearch/WithOSMUserSearch";
import WithTeamSearch from "../../../../HOCs/WithTeamSearch/WithTeamSearch";
import QuickWidget from "../../../../QuickWidget/QuickWidget";
import messages from "./Messages";

const descriptor = {
  widgetKey: "ProjectManagersWidget",
  label: messages.title,
  targets: [WidgetDataTarget.project],
  minWidth: 3,
  defaultWidth: 4,
  defaultHeight: 8,
};

const ChooseOSMUser = WithOSMUserSearch(AutosuggestTextBox);
const ChooseTeam = WithTeamSearch(AutosuggestTextBox);

export default class ProjectManagersWidget extends Component {
  state = {
    loadingManagers: true,
    updatingManagers: [],
    addManagerName: "",
    addManagerObject: null,
    addingManager: false,
    choosingTeam: false,
  };

  componentDidMount() {
    this.props
      .fetchProjectManagers(this.props.project.id)
      .then(() => this.setState({ loadingManagers: false }));
  }

  switchManagerType = (newType) => {
    this.setState({
      addManagerName: "",
      addManagerObject: null,
      choosingTeam: newType === "team",
    });
  };

  updateManagerRole = (manager, role) => {
    if (role === "remove") {
      this.removeManager(manager);
      return;
    }

    const isTeam = Number.isFinite(manager.groupType);
    const managerId = isTeam ? manager.id : manager.osmId;
    this.setState({
      updatingManagers: this.state.updatingManagers.concat([managerId]),
    });

    const updateManager = isTeam
      ? this.props.setTeamProjectRole(this.props.project.id, managerId, role)
      : this.props.setProjectManagerRole(this.props.project.id, manager.osmId, true, role);

    updateManager.then(() =>
      this.setState({
        updatingManagers: _without(this.state.updatingManagers, managerId),
      }),
    );
  };

  removeManager = (manager) => {
    const isTeam = Number.isFinite(manager.groupType);
    const managerId = isTeam ? manager.id : manager.osmId;
    this.setState({
      updatingManagers: this.state.updatingManagers.concat([managerId]),
    });

    const removeManager = isTeam
      ? this.props.removeTeamFromProject(this.props.project.id, manager.id)
      : this.props.removeProjectManager(this.props.project.id, manager.osmId, true);

    removeManager.then(() =>
      this.setState({
        updatingManagers: _without(this.state.updatingManagers, managerId),
      }),
    );
  };

  addManager = (role) => {
    if (!Number.isFinite(parseInt(role, 10))) {
      return;
    }

    this.setState({ addingManager: true });
    const addManager = this.state.choosingTeam
      ? this.props.setTeamProjectRole(this.props.project.id, this.state.addManagerObject.id, role)
      : this.props.addProjectManager(this.props.project.id, this.state.addManagerName, role);

    addManager.then(() =>
      this.setState({
        addManagerName: "",
        addManagerObject: null,
        addingManager: false,
      }),
    );
  };

  render() {
    if (!this.props.project || this.state.loadingManagers) {
      return <BusySpinner />;
    }

    const user = AsManager(this.props.user);

    const roleOptions = [
      <option key={Role.read} value={Role.read}>
        {this.props.intl.formatMessage(messagesByRole[Role.read])}
      </option>,

      <option key={Role.write} value={Role.write}>
        {this.props.intl.formatMessage(messagesByRole[Role.write])}
      </option>,

      <option key={Role.admin} value={Role.admin}>
        {this.props.intl.formatMessage(messagesByRole[Role.admin])}
      </option>,
    ];

    const adminManagers = _filter(
      this.props.project.managers.concat(this.props.project.teamManagers),
      (manager) => mostPrivilegedRole(manager.roles) === Role.admin,
    );

    let managers = _map(
      this.props.project.managers.concat(this.props.project.teamManagers),
      (manager) => {
        const isTeam = Number.isFinite(manager.groupType);
        const managerRole = mostPrivilegedRole(manager.roles);
        const isLastAdmin = managerRole === Role.admin && adminManagers.length < 2;

        // Add remove-manager option to dropdown if appropriate
        const dropdownOptions =
          user.canAdministrateProject(this.props.project) && !isLastAdmin
            ? roleOptions.concat([
                <option key="remove" value="remove">
                  {this.props.intl.formatMessage(messages.removeManagerLabel)}
                </option>,
              ])
            : roleOptions;

        return (
          <div
            key={isTeam ? `team-${manager.id}` : `user-${manager.osmId}`}
            className="mr-flex mr-items-center mr-pr-4 mr-mt-4"
          >
            {isTeam ? (
              <Fragment>
                <div className="mr-flex-grow-0 mr-mr-4">
                  <span className="mr-text-pink mr-text-xs mr-uppercase">
                    <FormattedMessage {...messages.teamIndicator} />
                  </span>
                </div>
                <div className="mr-flex-grow-0 mr-links-green-lighter mr-mr-2">{manager.name}</div>
              </Fragment>
            ) : (
              <Fragment>
                <div className="mr-flex-grow-0 mr-mr-4">
                  <figure className="mr-w-8 mr-h-8">
                    <img
                      src={AsAvatarUser(manager).profilePic(100)}
                      alt=""
                      className="mr-rounded-full"
                    />
                  </figure>
                </div>
                <div className="mr-flex-grow-0 mr-links-green-lighter mr-mr-2">
                  <Link to={`/user/metrics/${manager.userId}`}>{manager.displayName}</Link>
                </div>
              </Fragment>
            )}

            <div className="mr-flex-grow mr-border-b mr-border-white-15 mr-mr-4" />

            <div className="mr-flex-grow-0">
              {this.state.updatingManagers.indexOf(isTeam ? manager.id : manager.osmId) !== -1 ? (
                <BusySpinner />
              ) : (
                <Fragment>
                  {isTeam ? (
                    // A team's members reach the project at the role they hold
                    // in the team, so there is nothing to choose here.
                    <span className="mr-text-white-50 mr-text-xs">
                      <FormattedMessage {...messages.teamRoleFollowsTeam} />
                    </span>
                  ) : isLastAdmin || !user.canAdministrateProject(this.props.project) ? (
                    <FormattedMessage {...messagesByRole[managerRole]} />
                  ) : (
                    <select
                      value={managerRole}
                      onChange={(e) => this.updateManagerRole(manager, e.target.value)}
                      className="mr-select mr-py-1"
                    >
                      {dropdownOptions}
                    </select>
                  )}
                </Fragment>
              )}
            </div>
          </div>
        );
      },
    );

    if (managers.length === 0) {
      managers = (
        <div className="mr-text-grey-lighter">
          <FormattedMessage {...messages.noManagers} />
        </div>
      );
    }

    const widgetIntro = user.canAdministrateProject(this.props.project) && (
      <div className="mr-mb-4">
        <h3 className="mr-text-base mr-mb-4">
          <FormattedMessage {...messages.addManager} />
        </h3>

        <div className="mr-flex mr-justify-between">
          <div className="mr-mr-4 mr-flex-grow">
            {this.state.choosingTeam ? (
              <ChooseTeam
                inputValue={this.state.addManagerName}
                inputClassName="mr-py-2 mr-px-4 mr-border-none mr-placeholder-white-50 mr-text-white mr-rounded mr-bg-black-15 mr-shadow-inner"
                selectedItem={this.state.addManagerObject}
                onInputValueChange={(username) =>
                  this.setState({
                    addManagerName: username,
                  })
                }
                onChange={(osmUser) =>
                  this.setState({
                    addManagerObject: osmUser,
                  })
                }
                placeholder={this.props.intl.formatMessage(messages.teamNamePlaceholder)}
                fixedMenu
              />
            ) : (
              <ChooseOSMUser
                inputValue={this.state.addManagerName}
                inputClassName="mr-py-2 mr-px-4 mr-border-none mr-placeholder-white-50 mr-text-white mr-rounded mr-bg-black-15 mr-shadow-inner"
                selectedItem={this.state.addManagerObject}
                onInputValueChange={(username) =>
                  this.setState({
                    addManagerName: username,
                  })
                }
                onChange={(osmUser) =>
                  this.setState({
                    addManagerObject: osmUser,
                  })
                }
                placeholder={this.props.intl.formatMessage(messages.osmUsernamePlaceholder)}
                fixedMenu
              />
            )}
          </div>
          {!this.state.addingManager && !this.state.addManagerObject && (
            <select
              className="mr-select mr-flex-grow-0 mr-min-w-12"
              value={this.state.choosingTeam ? "team" : "user"}
              onChange={(e) => this.switchManagerType(e.target.value)}
            >
              <option key="user" value="user">
                {this.props.intl.formatMessage(messages.userOption)}
              </option>
              <option key="team" value="team">
                {this.props.intl.formatMessage(messages.teamOption)}
              </option>
            </select>
          )}
          {this.state.addingManager && <BusySpinner />}
          {!this.state.addingManager && this.state.addManagerObject && (
            <select
              onChange={(e) => this.addManager(e.target.value)}
              className="mr-flex-grow-0 mr-min-w-30 mr-select"
            >
              {[
                <option key="none" value="">
                  {this.props.intl.formatMessage(messages.chooseRole)}
                </option>,
              ].concat(roleOptions)}
            </select>
          )}
        </div>
      </div>
    );

    return (
      <QuickWidget
        {...this.props}
        className=""
        widgetTitle={<FormattedMessage {...messages.title} />}
        noMain
      >
        {widgetIntro}
        {managers}
      </QuickWidget>
    );
  }
}

registerWidgetType(ProjectManagersWidget, descriptor);
