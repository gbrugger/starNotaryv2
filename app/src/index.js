"use strict";

import starNotaryArtifact from "../../build/contracts/StarNotary.json";

const App = {
  web3: null,
  account: null,
  contract: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.contract = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address
      );

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      this.account = accounts[0];
    } catch (error) {
      App.setError(error);
    }
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  createStar: async function() {
    try {
      const { createStar } = this.contract.methods;
      const name = document.getElementById("starName").value;
      const id = document.getElementById("starId").value;
      await createStar(name, id).send({ from: this.account });
      App.setStatus(`New star name is ${name}. ID ${id}`);
    } catch (error) {
      App.setError(error);
    }
  },

  setError: async function(error) {
    console.error("Could not connect to contract or chain.", error);
    if (error.code === 4001) {
      // User rejected request
      App.setStatus("User rejected request in wallet.");
    }
  },
};

window.App = App;

window.addEventListener("load", async function() {
  if (window.ethereum) {
    App.web3 = new Web3(window.ethereum);
  } else {
    console.warn("No web3 detected. Falling back to http://172.29.7.230:8545.");
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://172.29.7.230:8545")
    );
  }

  App.start();
});

createStarButton.addEventListener("click", event => {
  App.createStar();
});
