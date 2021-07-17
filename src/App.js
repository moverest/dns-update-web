import "./App.css";
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
        this.refreshHosts().then(() => {
          this.setState({ screen: "hosts" });
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
      .then((response) => response.json())
      .then((data) => {
        this.setState({ hosts: data.hosts });
      });
  }

  render() {
    return screens[this.state.screen].call(this);
  }
}

const screens = {
  login: function () {
    return <ConnectForm onSubmit={this.updateCredentials} />;
  },
  loading: function () {
    return <p>Loading...</p>;
  },

  hosts: function () {
    const hosts = Object.entries(this.state.hosts).map(([name, info]) => (
      <Host host={{ name: name, ...info }} key={name} />
    ));
    return (
      <div>
        <button onClick={this.logout}>Logout</button>
        <table>
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
    );
  },
};

const Host = (props) => {
  const host_url = `https://${props.host.name}`;
  return (
    <tr>
      <td>
        <a href={host_url}>{props.host.name}</a>
      </td>
      <IPInfo ip={props.host.ipv4} />
      <IPInfo ip={props.host.ipv6} />
    </tr>
  );
};

const IPInfo = (props) => (
  <td>
    {props.ip.address} ({props.ip.last_ping})
    <table>
      <tbody>
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
  </td>
);

class ConnectForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { base_uri: "", api_key: "", remember: false };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onSubmit = props.onSubmit;
  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    this.setState({ [target.name]: value });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.onSubmit(this.state);
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Base URI
          <input
            name="base_uri"
            type="text"
            value={this.state.base_uri}
            onChange={this.handleChange}
          />
        </label>
        <label>
          API Key
          <input
            name="api_key"
            type="text"
            value={this.state.api_key}
            onChange={this.handleChange}
          />
        </label>
        <label>
          <input
            name="remember"
            type="checkbox"
            value={this.state.remember}
            onChange={this.handleChange}
          />
          Remember me
        </label>
        <button type="submit">Connect</button>
      </form>
    );
  }
}

export default App;
