const KVstore = artifacts.require("KVstore");

module.exports = function (deployer) {
  deployer.deploy(KVstore);
};
