import React from "react";

export const Hosts = (props) => {
  const hosts = Object.entries(props.hosts).map(([name, info]) => (
    <Host host={{ name: name, ...info }} key={name} />
  ));
  return (
    <div>
      <div className="navbar">
        <button onClick={props.onLogout}>Logout</button>
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

export default Hosts;
