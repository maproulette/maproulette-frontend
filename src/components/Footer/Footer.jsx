import { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import img from "../../../images/osmus-logo.svg";
import SvgSymbol from "../SvgSymbol/SvgSymbol";
import messages from "./Messages";

class Footer extends Component {
  state = {
    serviceInfo: null,
  };

  componentDidMount() {
    this._isMounted = true;
    fetch(`${window.env.REACT_APP_MAP_ROULETTE_SERVER_URL}/api/v2/service/info`)
      .then((res) => res.json())
      .then((serviceInfo) => {
        if (this._isMounted) this.setState({ serviceInfo });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    let frontendVersion = __GIT_TAG__ !== "" ? __GIT_TAG__ : __GIT_SHA__.slice(0, 7);
    let frontendVersionUrl =
      __GIT_TAG__ !== ""
        ? `https://github.com/maproulette/maproulette3/releases/tag/${__GIT_TAG__}`
        : `https://github.com/maproulette/maproulette3/commit/${__GIT_SHA__}`;

    let info = this.state.serviceInfo?.compiletime;
    let backendVersion =
      info?.version === info?.gitHeadCommit ? info?.gitHeadCommit.slice(0, 7) : info?.version;
    let backendVersionUrl =
      info?.version === info?.gitHeadCommit
        ? `https://github.com/maproulette/maproulette-backend/commit/${info?.gitHeadCommit}`
        : `https://github.com/maproulette/maproulette-backend/releases/tag/v${info?.version}`;

    return (
      <footer className="mr-px-4 mr-py-12 mr-bg-gradient-to-r mr-from-blue-900 mr-to-blue-800">
        <div className="mr-max-w-6xl mr-mx-auto">
          <div className="mr-grid md:mr-grid-cols-5 mr-gap-8 mr-items-start">
            {/* Logo Section */}
            <div className="md:mr-col-span-1">
              <h3 className="mr-text-green-lighter mr-text-sm mr-font-medium mr-mb-2">
                <FormattedMessage {...messages.supportedByHeading} />
              </h3>
              <a href="https://openstreetmap.us" target="_blank" rel="noopener noreferrer">
                <img
                  src={img}
                  alt={this.props.intl.formatMessage(messages.osmAltText)}
                  className="mr-max-w-xs"
                />
              </a>
            </div>

            {/* Version Info Section */}
            <div className="md:mr-col-span-1">
              <h3 className="mr-text-green-lighter mr-text-sm mr-font-medium mr-mb-4">
                <FormattedMessage {...messages.versionsHeading} />
              </h3>
              <div className="mr-space-y-2">
                <p className="mr-text-white mr-text-sm">
                  <FormattedMessage {...messages.versionLabel} />{" "}
                  <a
                    href={frontendVersionUrl}
                    className="mr-text-green-lighter mr-font-mono hover:mr-text-green-300 mr-transition-colors"
                  >
                    {frontendVersion}
                  </a>
                </p>
                {this.state.serviceInfo && (
                  <p className="mr-text-white mr-text-sm">
                    <FormattedMessage {...messages.APIVersionLabel} />{" "}
                    <a
                      href={backendVersionUrl}
                      className="mr-text-green-lighter mr-font-mono hover:mr-text-green-300 mr-transition-colors"
                    >
                      {backendVersion}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Links Section */}
            <div className="md:mr-col-span-1">
              <h3 className="mr-text-green-lighter mr-text-sm mr-font-medium mr-mb-4">
                <FormattedMessage {...messages.linksHeading} />
              </h3>
              <ul className="mr-space-y-2">
                <li>
                  <a
                    href={window.env.REACT_APP_DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-text-white mr-text-sm hover:mr-text-green-300 mr-transition-colors mr-flex mr-items-center"
                  >
                    <SvgSymbol
                      sym="book-icon"
                      viewBox="0 0 24 24"
                      className="mr-w-4 mr-h-4 mr-mr-2 mr-fill-current"
                    />
                    <FormattedMessage {...messages.documentation} />
                  </a>
                </li>
                <li>
                  <a
                    href={window.env.REACT_APP_BLOG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-text-white mr-text-sm hover:mr-text-green-300 mr-transition-colors mr-flex mr-items-center"
                  >
                    <SvgSymbol
                      sym="blog-icon"
                      viewBox="0 0 20 20"
                      className="mr-w-4 mr-h-4 mr-mr-2 mr-fill-current"
                    />
                    <FormattedMessage {...messages.viewBlog} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/maproulette/maproulette3/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-text-white mr-text-sm hover:mr-text-green-300 mr-transition-colors mr-flex mr-items-center"
                  >
                    <SvgSymbol
                      sym="github-icon"
                      viewBox="0 0 20 20"
                      className="mr-w-4 mr-h-4 mr-mr-2 mr-fill-current"
                    />
                    <FormattedMessage {...messages.reportBug} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Donate Section */}
            <div className="md:mr-col-span-1">
              <h3 className="mr-text-green-lighter mr-text-sm mr-font-medium mr-mb-4">
                <FormattedMessage {...messages.donateHeading} />
              </h3>
              <a
                href="https://openstreetmap.app.neoncrm.com/forms/maproulette"
                target="_blank"
                rel="noopener noreferrer"
                className="mr-inline-flex mr-items-center mr-text-white mr-text-sm hover:mr-text-green-300 mr-transition-colors"
              >
                <SvgSymbol
                  sym="icon-donation"
                  viewBox="0 0 20 20"
                  className="mr-w-4 mr-h-4 mr-mr-2 mr-fill-current"
                />
                <FormattedMessage {...messages.donateButton} />
              </a>
            </div>

            {/* Social Section */}
            <div className="md:mr-col-span-1">
              <h3 className="mr-text-green-lighter mr-text-sm mr-font-medium mr-mb-4">
                <FormattedMessage {...messages.socialHeading} />
              </h3>
              <a
                href="https://en.osm.town/@MapRoulette"
                target="_blank"
                rel="noopener noreferrer"
                className="mr-inline-flex mr-items-center mr-text-white mr-text-sm hover:mr-text-green-300 mr-transition-colors"
              >
                <SvgSymbol
                  sym="icon-mastodon"
                  viewBox="0 0 20 20"
                  className="mr-w-4 mr-h-4 mr-mr-2 mr-fill-current"
                />
                <FormattedMessage {...messages.mastodonButton} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }
}

export default injectIntl(Footer);
