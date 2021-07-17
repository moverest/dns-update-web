import "./App.scss";
import React from "react";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.updateCredentials = this.updateCredentials.bind(this);
    this.logout = this.logout.bind(this);

    let start_screen = "login";

    const credentials = this.getSavedCredentials();
    if (credentials !== undefined) {
      start_screen = "loading";
    }

    this.state = {
      hosts: null,
      screen: start_screen,
      credentials: credentials,
      login_error: null,
    };
  }

  componentDidMount() {
    if (this.state.screen === "loading") {
      this.updateCredentials(this.state.credentials);
    }
  }

  updateCredentials(credentials) {
    if (credentials.remember) {
      this.saveCredentials(credentials);
    }

    this.setState(
      (state, props) => ({ credentials: credentials, screen: "loading" }),
      () => {
        this.refreshHosts().then((ok) => {
          if (ok) {
            this.setState({ screen: "hosts" });
          }
        });
      }
    );
  }

  getSavedCredentials() {
    const base_uri = localStorage.getItem("base_uri");
    const api_key = localStorage.getItem("api_key");

    if (base_uri === null || api_key === null) {
      return undefined;
    }

    return {
      base_uri: base_uri,
      api_key: api_key,
      remember: true,
    };
  }

  clearSavedCredentials() {
    localStorage.removeItem("base_uri");
    localStorage.removeItem("api_key");
  }

  saveCredentials(credentials) {
    localStorage.setItem("base_uri", credentials.base_uri);
    localStorage.setItem("api_key", credentials.api_key);
  }

  logout() {
    this.clearSavedCredentials();
    window.location.reload(true);
  }

  refreshHosts() {
    return fetch(
      `${this.state.credentials.base_uri}/hosts?show_ipv4=true&show_ipv6=true`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.state.credentials.api_key}`,
        },
      }
    )
      .then((r) => {
        if (r.status === 401) {
          this.setState({
            login_error: "authentication-error",
            screen: "login",
          });
          return null;
        }
        return r.json();
      })
      .catch((error) => {
        this.setState({ login_error: "network-error", screen: "login" });
        return null;
      })
      .then((data) => {
        if (data !== null) {
          this.setState({ hosts: data.hosts });
          return true;
        }

        return false;
      });
  }

  render() {
    return screens[this.state.screen].call(this);
  }
}

const screens = {
  login: function () {
    return (
      <ConnectForm
        onSubmit={this.updateCredentials}
        error={this.state.login_error}
      />
    );
  },
  loading: function () {
    return <p className="loading">Loading...</p>;
  },

  hosts: function () {
    const hosts = Object.entries(this.state.hosts).map(([name, info]) => (
      <Host host={{ name: name, ...info }} key={name} />
    ));
    return (
      <div>
        <div className="navbar">
          <button onClick={this.logout}>Logout</button>
        </div>
        <div className="content">
          <table className="host-table">
            <thead>
              <tr>
                <th>Host</th>
                <th>IPv4</th>
                <th>IPv6</th>
              </tr>
            </thead>
            <tbody>{hosts}</tbody>
          </table>
        </div>
      </div>
    );
  },
};

const Host = (props) => {
  const host_url = `https://${props.host.name}`;
  return (
    <tr>
      <td className="host-name">
        <a href={host_url}>{props.host.name}</a>
      </td>
      <IPInfo
        ip={props.host.ipv4}
        enabled={props.host.ipv4_enabled}
        type="ipv4"
      />
      <IPInfo
        ip={props.host.ipv6}
        enabled={props.host.ipv6_enabled}
        type="ipv6"
      />
    </tr>
  );
};

const IPInfo = (props) => {
  const td_class = `ip-info type-${props.type}`;
  const cell_content = props.enabled ? (
    <table className="ip-info">
      <tbody>
        <tr>
          <th></th>
          <td className="ip">{props.ip.address}</td>
        </tr>
        <tr
          className={
            props.ip.last_ping !== _get_current_date_string()
              ? "warning"
              : undefined
          }
        >
          <th>Last ping</th>
          <td> {props.ip.last_ping}</td>
        </tr>
        <tr>
          <th>Last change</th>
          <td>{props.ip.last_change}</td>
        </tr>
        <tr>
          <th>Record ID</th>
          <td>{props.ip.cf_dns_record_id}</td>
        </tr>
      </tbody>
    </table>
  ) : (
    <span class="disabled">Disabled</span>
  );
  return <td className={td_class}>{cell_content}</td>;
};

function _get_current_date_string() {
  return new Date().toISOString().split("T")[0];
}

const LOGIN_ERROR_DESC = {
  "authentication-error": "Authentication error.",
  "network-error": "Could not reach service.",
  "insecure-service-error": "Insecure service. Refusing to connect.",
};

class ConnectForm extends React.Component {
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

export default App;
