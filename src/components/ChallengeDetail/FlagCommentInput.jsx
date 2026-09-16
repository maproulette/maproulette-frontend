import classNames from "classnames";
import { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import {
  CHALLENGE_REPORT_MAX_LENGTH,
  CHALLENGE_REPORT_MIN_LENGTH,
  reportChallenge,
} from "../../services/Challenge/ChallengeReports";
import AutosuggestMentionTextArea from "../AutosuggestTextBox/AutosuggestMentionTextArea";
import MarkdownContent from "../MarkdownContent/MarkdownContent";
import messages from "./Messages";

export class FlagCommentInput extends Component {
  state = {
    showingPreview: false,
    characterCount: 0,
    value: "",
    checked: false,
    emailValue: this.props.user.settings.email || "",
    submittingFlag: false,
    submitError: null,
  };

  handleSubmit = async () => {
    this.setState({ submittingFlag: true, submitError: null });

    if (this.state.characterCount < CHALLENGE_REPORT_MIN_LENGTH) {
      this.props.handleInputError();
    } else if (!this.state.checked) {
      this.props.handleCheckboxError();
    } else {
      try {
        // The reporter comes from the session server-side, and the backend
        // posts the accompanying challenge comment itself, so the report text
        // is all there is to send.
        const report = await reportChallenge(
          this.props.challenge.id,
          this.state.value,
          this.state.emailValue.trim() || undefined,
        );

        this.props.onModalSubmit(report);
        this.props.handleViewCommentsSubmit();
      } catch (error) {
        // The server rejects a report that is too short or too long, carries a
        // malformed email, or duplicates one the reporter already has open. Its
        // message says which, so show it rather than failing silently.
        this.setState({
          submitError:
            error.details?.message ?? this.props.intl.formatMessage(messages.reportSubmitError),
        });
      }
    }

    this.setState({ submittingFlag: false });
  };

  handleChange = (val) => {
    if (val.length <= CHALLENGE_REPORT_MAX_LENGTH) {
      this.setState({ ...this.state, value: val, characterCount: val.length, submitError: null });
    }
  };

  handleToggle = () => {
    this.setState({ checked: !this.state.checked });
  };

  render() {
    const maxCharacterCount = CHALLENGE_REPORT_MAX_LENGTH;
    const minCharacterCount = CHALLENGE_REPORT_MIN_LENGTH;
    return (
      <div className="mr-mt-2">
        <label htmlFor="root_email" className="mr-text-white-50">
          <FormattedMessage {...messages.email} />
        </label>
        <input
          className="form-control mr-mb-4"
          type="email"
          id="root_email"
          label={this.props.intl.formatMessage(messages.emailAddressLabel)}
          placeholder={this.props.intl.formatMessage(messages.enterEmailPlaceholder)}
          value={this.state.emailValue}
          onChange={(event) => this.setState({ emailValue: event.target.value })}
        />
        <div className="mr-flex mr-justify-between mr-mb-2 mr-leading-tight mr-text-xxs">
          <div className="mr-flex mr-items-center">
            <button
              className={classNames(
                "mr-pr-2 mr-mr-2 mr-border-r mr-border-green mr-uppercase mr-font-medium",
                this.state.showingPreview ? "mr-text-green-lighter" : "mr-text-white",
              )}
              onClick={() => this.setState({ showingPreview: false })}
            >
              <FormattedMessage {...messages.write} />
            </button>
            <button
              className={classNames(
                "mr-uppercase mr-font-medium",
                !this.state.showingPreview ? "mr-text-green-lighter" : "mr-text-white",
              )}
              onClick={() => this.setState({ showingPreview: true })}
            >
              <FormattedMessage {...messages.preview} />
            </button>
          </div>
          <div
            className={classNames({
              "mr-text-dark-yellow":
                this.state.characterCount < maxCharacterCount &&
                this.state.characterCount > maxCharacterCount * 0.9,
              "mr-text-red-light":
                this.state.characterCount >= maxCharacterCount ||
                this.state.characterCount < minCharacterCount,
            })}
          >
            {this.state.characterCount}/{maxCharacterCount}
          </div>
        </div>
        {this.state.showingPreview ? (
          <div
            className={
              this.props.previewClassName
                ? this.props.previewClassName
                : "mr-border-2 mr-rounded mr-border-black-15 mr-px-2 mr-min-h-8"
            }
          >
            <MarkdownContent markdown={this.state.value} />
          </div>
        ) : (
          <AutosuggestMentionTextArea
            inputClassName="mr-appearance-none mr-outline-none mr-input mr-text-white mr-placeholder-medium mr-bg-grey-lighter-10 mr-border-none mr-shadow-inner mr-p-3 mr-font-mono mr-text-sm"
            previewClassName="mr-border-2 mr-rounded mr-border-grey-lighter-10 mr-p-2 mr-max-h-48 mr-overflow-y-scroll"
            rows={4}
            cols="1"
            inputValue={this.state.value}
            onInputValueChange={this.handleChange}
            placeholder={this.props.intl.formatMessage(messages.enterTextPlaceholder)}
            disableResize={true}
            search={() => null}
            disableShowSuggestions
          />
        )}
        <div className="form mr-flex mr-items-baseline">
          <input
            id="review-label"
            type="checkbox"
            className="mr-mr-2"
            checked={this.state.checked}
            onChange={this.handleToggle}
          />
          <label htmlFor="review-label" className="mr-text-white-50">
            <FormattedMessage {...messages.review} />
          </label>
        </div>
        {this.props.displayInputError && (
          <div className="mr-text-red">
            <FormattedMessage {...messages.textInputError} />
          </div>
        )}
        {this.props.displayCheckboxError && (
          <div className="mr-text-red">
            <FormattedMessage {...messages.checkboxError} />
          </div>
        )}
        {this.state.submitError && <div className="mr-text-red">{this.state.submitError}</div>}
        <div className="mr-flex mr-items-center mr-mt-6">
          <button
            className="mr-button mr-button--white mr-mr-12 mr-px-8"
            onClick={this.handleSubmit}
            disabled={this.state.submittingFlag}
          >
            <FormattedMessage {...messages.submitReport} />
          </button>
        </div>
      </div>
    );
  }
}

export default injectIntl(FlagCommentInput);
