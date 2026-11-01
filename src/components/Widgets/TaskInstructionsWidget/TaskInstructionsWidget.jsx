import classNames from "classnames";
import PropTypes from "prop-types";
import { Component } from "react";
import { FormattedMessage } from "react-intl";
import { WidgetDataTarget, registerWidgetType } from "../../../services/Widget/Widget";
import QuickWidget from "../../QuickWidget/QuickWidget";
import SvgSymbol from "../../SvgSymbol/SvgSymbol";
import TaskInstructions from "../../TaskPane/TaskInstructions/TaskInstructions";
import messages from "./Messages";

const descriptor = {
  widgetKey: "TaskInstructionsWidget",
  label: messages.label,
  targets: [WidgetDataTarget.task],
  minWidth: 3,
  defaultWidth: 3,
  minHeight: 3,
  defaultHeight: 10,
};

export default class TaskInstructionsWidget extends Component {
  state = {
    /**
     * Since the API is involved, collapsing the widget takes an undeterminable amount of time
     * and needs a loader to account for it.
     */
    collapsing: false,
  };

  resetLoader = () => {
    this.setState({ collapsing: false });
  };

  /**
   * Invoked to toggle minimization of the challenge instructions. If the user
   * is working through a virtual challenge, we nevertheless set the preference
   * on the actual challenge being worked on (not the virtual challenge) as the
   * instructions will obviously vary from challenge to challenge if the user
   * works through tasks from multiple challenges.
   */
  toggleMinimized = () => {
    this.setState({ collapsing: true });
    const challengeId = this.props.task?.parent?.id;
    if (Number.isFinite(challengeId)) {
      if (!this.props.collapseInstructions) {
        // Save our current height before collapsing so that we can restore it
        // later (as our actual height from the widget workspace will reflect
        // our collapsed state)
        this.props.updateWidgetConfiguration({
          expandedHeight: this.props.widgetLayout.h,
        });
      }

      this.props.setInstructionsCollapsed(challengeId, false, !this.props.collapseInstructions);
    }

    //this is not ideal, but it will prevent spam clicks until a more asynchronous flow is built for this toggle
    setTimeout(this.resetLoader, 800);
  };

  adjustHeightForMinimization = () => {
    if (this.props.collapseInstructions && this.props.widgetLayout.h > descriptor.minHeight) {
      this.props.updateWidgetHeight(this.props.widgetLayout.i, descriptor.minHeight);
    } else if (
      !this.props.collapseInstructions &&
      this.props.widgetLayout.h === descriptor.minHeight
    ) {
      this.props.updateWidgetHeight(
        this.props.widgetLayout.i,
        Number.isFinite(this.props.widgetConfiguration.expandedHeight)
          ? this.props.widgetConfiguration.expandedHeight
          : descriptor.defaultHeight,
      );
    }
  };

  componentDidMount() {
    this.adjustHeightForMinimization();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.collapseInstructions !== this.props.collapseInstructions) {
      this.adjustHeightForMinimization();
    }
  }

  render() {
    const minimizeControl = (
      <button
        className="mr-text-green-lighter"
        onClick={this.toggleMinimized}
        disabled={this.state.collapsing}
      >
        <SvgSymbol
          sym="icon-cheveron-down"
          viewBox="0 0 20 20"
          className="mr-transition mr-fill-current mr-min-w-6 mr-w-6 mr-h-6"
        />
      </button>
    );

    return (
      <QuickWidget
        {...this.props}
        className={classNames("task-instructions-widget", {
          "is-expanded": !this.props.collapseInstructions,
        })}
        widgetTitle={<FormattedMessage {...messages.title} />}
        rightHeaderControls={minimizeControl}
      >
        <TaskInstructions {...this.props} />
      </QuickWidget>
    );
  }
}

TaskInstructionsWidget.propTypes = {
  collapseInstructions: PropTypes.bool,
  setInstructionsCollapsed: PropTypes.func.isRequired,
};

registerWidgetType(TaskInstructionsWidget, descriptor);
