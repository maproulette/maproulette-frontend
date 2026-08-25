import { Component } from "react";
import ConfettiModule from "react-dom-confetti";
import { FormattedMessage } from "react-intl";
import Modal from "../Modal/Modal";
import SvgSymbol from "../SvgSymbol/SvgSymbol";
import messages from "./Messages";
import "./CongratulateModal.scss";

// react-dom-confetti is Babel-era CJS: `exports.default = Confetti` alongside an
// `__esModule` marker. Vite's dep optimizer doesn't pick up on that marker and
// emits `export default require_confetti()`, so a default import receives the
// whole module object rather than the component. Unwrap it here; the fallback
// covers bundlers that do honor the marker and hand back the class directly.
const Confetti = ConfettiModule?.default ?? ConfettiModule;

/**
 * CongratulateModal presents a celebratory modal that displays a
 * congratulatory message along with a confetti cannon visual effect
 *
 * @author [Neil Rotstan](https://github.com/nrotstan)
 */
export default class CongratulateModal extends Component {
  state = {
    confetti: false,
    active: true,
  };

  dismiss = () => this.setState({ active: false });

  componentDidMount() {
    setTimeout(() => this.setState({ confetti: true }), 1000);
  }

  render() {
    return (
      <Modal
        className="congratulate-modal"
        contentClassName="mr-bg-blue-dark"
        onClose={this.dismiss}
        isActive={this.state.active}
        extraNarrow
      >
        <div className="congratulate-modal__content mr-bg-blue-dark mr-text-white">
          <div className="congratulate-modal__message">
            <SvgSymbol
              sym="trophy-icon"
              viewBox="0 0 20 20"
              className="congratulate-modal__message__trophy"
            />
            <h2>
              <FormattedMessage {...messages.header} />
            </h2>
            <p>
              <FormattedMessage {...messages.primaryMessage} />
            </p>
            <Confetti className="congratulate-modal__confetti" active={this.state.confetti} />
            <button className="mr-button mr-mt-8" onClick={this.dismiss}>
              <FormattedMessage {...messages.dismiss} />
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}
