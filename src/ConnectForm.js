import React from "react";

const LOGIN_ERROR_DESC = {
  "authentication-error": "Authentication error.",
  "network-error": "Could not reach service.",
  "insecure-service-error": "Insecure service. Refusing to connect.",
};

export class ConnectForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      base_uri: "",
      api_key: "",
      remember: false,
      error: props.error,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onSubmit = props.onSubmit;
  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;

    let error = null;
    if (target.name === "base_uri" && is_uri_insecure(value)) {
      error = "insecure-service-error";
    }

    this.setState({ [target.name]: value, error: error });
  }

  handleSubmit(event) {
    event.preventDefault();

    if (is_uri_insecure(this.state.base_uri)) {
      return;
    }

    this.onSubmit(this.state);
  }

  render() {
    let error = "";
    if (this.state.error !== null) {
      console.log("error", this.state.error);
      let error_text = LOGIN_ERROR_DESC[this.state.error];
      if (error_text === undefined) {
        error_text = "Error.";
      }

      error = <div className="error">🛑 {error_text}</div>;
    }

    return (
      <div className="login-container">
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="base_uri">Base URI</label>
          <input
            name="base_uri"
            type="text"
            value={this.state.base_uri}
            onChange={this.handleChange}
          />
          <label htmlFor="api_key">API Key</label>
          <input
            name="api_key"
            type="password"
            value={this.state.api_key}
            onChange={this.handleChange}
          />
          <label htmlFor="remember">
            <input
              name="remember"
              type="checkbox"
              value={this.state.remember}
              onChange={this.handleChange}
            />
            Remember me
          </label>
          <button type="submit">Connect</button>
          {error}
        </form>
      </div>
    );
  }
}

function is_uri_insecure(uri) {
  return uri.startsWith("http:");
}

export default ConnectForm;
