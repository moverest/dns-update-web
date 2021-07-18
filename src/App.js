import "./App.scss";
import Hosts from "./Hosts.js";
import ConnectForm from "./ConnectForm.js";
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
        credentials={this.state.credentials}
      />
    );
  },
  loading: function () {
    return <p className="loading">Loading...</p>;
  },

  hosts: function () {
    return <Hosts onLogout={this.logout} hosts={this.state.hosts} />;
  },
};

export default App;
