import React, { Component } from 'react';
import CloneContract from '../build/contracts/Clone.json';
import getWeb3 from './utils/getWeb3';
import Home from './components/Home';
import Account from './components/Account';
import Robot from './components/Robot';
import Faq from './components/Faq';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

const contract = require('truffle-contract');
const Clone = contract(CloneContract);
let CloneInstance;

import './css/gallery.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      account: 0x0,
      web3: null,
      Clone: '',
      isLoading: false,
      balance: 0,
      mqttOutput: '',
      robots: [],
      robotName: '',
      robotPrice: ''
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.displayAccountInfo();
      this.instantiateContract();
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  displayAccountInfo() {
    // Get account.
    this.state.web3.eth.getCoinbase((err, account) => {
      if(err === null) {
        Clone.deployed().then((instance) => {
          CloneInstance = instance
          this.setState({
            account: account
          })
          this.state.web3.eth.getBalance(account, (error, success) => {
            this.setState({
              balance: this.state.web3.fromWei(success, "ether").toNumber()
            })
          });
        });
      }
    });
  }

  instantiateContract() {

    this.setState({
      Clone: Clone
    })
    Clone.setProvider(this.state.web3.currentProvider)

    // Listen for events
    this.listenToEvents();

    return this.reloadRobots();
  }
  // Listen for events raised from the contract
  listenToEvents() {
    Clone.deployed().then((instance) => {
      instance.generationEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch((error, event) => {
        // App.reloadRobots();
      });

      instance.printEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch((error, event) => {
        // App.reloadRobots();
      });

      instance.needsMaintenanceEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch((error, event) => {
        // App.reloadRobots();
      });

      instance.inMaintenanceModeEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch((error, event) => {
        // App.reloadRobots();
      });

      instance.createRobotEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch((error, event) => {
        // this.reloadRobots();
      });
    });
  }

  reloadRobots() {
    // refresh account information because the balance may have changed
    this.displayAccountInfo();

    let cloneInstance;
    //
    Clone.deployed().then((instance) => {
      cloneInstance = instance;
      return cloneInstance.getRobotsForSale();
    }).then((robotIds) => {
      let bots = [];
      for (let i = 0; i < robotIds.length; i++) {
        let robotId = robotIds[i];
        cloneInstance.robots(robotId).then((robot) => {
          bots.push({
            id: robot[0],
            seller: robot[1],
            name: robot[3],
            price: robot[4],
            maintenance: robot[5].toString()
          })
        }).then((result) => {
          this.setState({
            robots: bots
          });
        });
      }
    }).catch(function(err) {
    });
  }

  render() {

    let loader;
    if(this.state.isLoading) {
      loader = <div className="loader"></div>;
    }

    const HomePage = (props) => {
      return (
        <Home
          account={this.state.account}
          balance={this.state.balance}
          clone={this.state.Clone}
          reloadRobots={this.reloadRobots.bind(this)}
          web3={this.state.web3}
          robots={this.state.robots}
        />
      );
    };

    const AccountPage = (props) => {
      return (
        <Account
          account={this.state.account}
          balance={this.state.balance}
        />
      );
    };

    const RobotPage = (props) => {
      return (
        <Robot
          robot={this.state.account}
          account={this.state.account}
          clone={this.state.Clone}
        />
      );
    };

    const FaqPage = (props) => {
      return (
        <Faq
        />
      );
    };

    return (
      <Router className="">
        <div>
          <div className="header">
            <div className="pure-menu pure-menu-horizontal">
                <Link className="pure-menu-heading" to="/">BotMaker</Link>

                <ul className="pure-menu-list">
                  <li className="pure-menu-item pure-menu-selected"><Link className="pure-menu-link" to="/">Home</Link></li>
                  <li className="pure-menu-item"><Link className="pure-menu-link" to="/faq">FAQ</Link></li>
                </ul>
                <Link className="pure-menu-heading right" to="/">Account: {this.state.account} | Balance: {this.state.balance} ETH</Link>
            </div>
          </div>
          <main>
            <Route exact
              path="/"
              render={HomePage} />
            <Route
              path="/accounts/:account_id"
              render={AccountPage} />
            <Route
              path="/accounts/:account_id/robots/:robot_id"
              render={RobotPage} />
            <Route
              path="/faq"
              render={FaqPage} />
          </main>
          <div className="footer">
            Made w/ ❤️ on EARTH.
          </div>
        </div>
      </Router>
    );
  }
}

export default App
