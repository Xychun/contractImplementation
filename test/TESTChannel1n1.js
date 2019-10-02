const truffleAssert = require("truffle-assertions");
const Channel1n1 = artifacts.require("Channel1n1");

var channel1n1;

//   enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }

contract("Channel1n1 Tests", async accounts => {
  const car1 = accounts[0];
  const car2 = accounts[1];
  const car3 = accounts[2];

  describe("Successful Open channel", function() {
    beforeEach(async () => {
      channel1n1 = await Channel1n1.new();
      await channel1n1.openChannel();
    });

    it("creates channel object", async () => {
      var channel;
      await channel1n1.channels.call(0).then(function(f) {
        channel = f;
      });
      let value = channel[2].toString(); // address car1;
      let expected = car1;
      assert.equal(value, expected, "Channel object was not created");
    });

    it("initializes car1 state correctly", async () => {
      var channel;
      await channel1n1.channels.call(0).then(function(f) {
        channel = f;
      });
      let value = channel[0][0].toString();
      let expected = 1; // CONNECTING: because of enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }
      assert.equal(
        value,
        expected,
        "Channel state is not initialized correctly"
      );
    });

    it("initializes car2 state correctly", async () => {
      var channel;
      await channel1n1.channels.call(0).then(function(f) {
        channel = f;
      });
      let value = channel[1][0].toString();
      let expected = 0; // IDLE: because of enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }
      assert.equal(
        value,
        expected,
        "Channel state is not initialized correctly"
      );
    });
  });

  describe("Successful Join channel", function() {
    beforeEach(async () => {
      channel1n1 = await Channel1n1.new();
      await channel1n1.openChannel({
        from: car1
      });
      await channel1n1.joinChannel(0, {
        from: car2
      });
    });

    it("adds car2 into the channel", async () => {
      var channel;
      await channel1n1.channels.call(0).then(function(f) {
        channel = f;
      });
      let value = channel[3].toString(); // address car2;
      let expected = car2;
      assert.equal(value, expected, "Car2 not added to the channel");
    });

    it("sets the correct block number", async () => {
      var channel;
      await channel1n1.channels.call(0).then(function(f) {
        channel = f;
      });
      let value = channel[5].toString(); // uint256 startingBlock;
      let expected = await web3.eth.getBlockNumber();
      assert.equal(value, expected, "Does not set the correct block number");
    });

    it("updates car2 state correctly", async () => {
      var channel;
      await channel1n1.channels.call(0).then(function(f) {
        channel = f;
      });
      let value = channel[1][0].toString();
      let expected = 2; // CONNECTED: because of enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }
      assert.equal(value, expected, "Channel state is not updated correctly");
    });

    describe("NOT Successful Join channel", function() {
      beforeEach(async () => {
        channel1n1 = await Channel1n1.new();
        await channel1n1.openChannel({
          from: car1
        });
      });

      it("cannot join a non existing channel ID", async () => {
        await truffleAssert.reverts(
          channel1n1.joinChannel(1, {
            from: car2
          }),
          "ChannelID does not exist"
        );
      });

      it("cannot join a channel that is already full", async () => {
        await channel1n1.joinChannel(0, {
          from: car2
        });
        await truffleAssert.reverts(
          channel1n1.joinChannel(0, {
            from: car3
          }),
          "This channel is full or not initialized correctly"
        );
      });

      it("Car cannot join his own channel", async () => {
        await truffleAssert.reverts(
          channel1n1.joinChannel(0, {
            from: car1
          }),
          "This channel is full or not initialized correctly"
        );
      });
    });
  });

  describe("Successful Close channel", function() {
    beforeEach(async () => {
      channel1n1 = await Channel1n1.new();
      await channel1n1.openChannel({
        from: car1
      });
      await channel1n1.joinChannel(0, {
        from: car2
      });
    });

    it("sets first close approval", async () => {
      let channelId = 0;

      // parameters car1
      let status = 3; // enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }
      let nonce = 1337;
      let latitude = 4624644; // in DD(Decimal Degrees) - xx.xxxxx between 90 and -90
      let longitude = 1435776; // in DD(Decimal Degrees) - xx.xxxxx between 180 and -180
      let direction = 0; // in degrees
      let speed = 232; // in km/h
      let acceleration = 1; // in m/s^2

      let hash = web3.eth.abi.encodeParameters(
        [
          "uint256",
          "address",
          "uint8",
          "uint256",
          "int32",
          "int32",
          "uint16",
          "uint16",
          "int8"
        ],
        [
          channelId,
          car1,
          status,
          nonce,
          latitude,
          longitude,
          direction,
          speed,
          acceleration
        ]
      );
      let hashKeccak = web3.utils.keccak256(hash);

      let sig = await web3.eth.accounts.sign(
        hashKeccak,
        "0x31a7e5c9ee676f39b66c8ca4e2b18c259fc1e93a38e52d62468c3a67041b4215" // private key car2
      );

      let result = await channel1n1.closeChannel(
        channelId,
        sig.signature,
        status,
        nonce,
        latitude,
        longitude,
        direction,
        speed,
        acceleration,
        { from: car1 }
      );

      truffleAssert.eventEmitted(result, "OnCloseChannel", ev => {
        return ev.channelId == 0 && ev.car == car1 && ev.closed == false;
      });
    });

    it("closes the channel", async () => {
      let channelId = 0;

      // parameters car1
      let status1 = 3; // enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }
      let nonce1 = 1337;
      let latitude1 = 4624644; // in DD(Decimal Degrees) - xx.xxxxx between 90 and -90
      let longitude1 = 1435776; // in DD(Decimal Degrees) - xx.xxxxx between 180 and -180
      let direction1 = 0; // in degrees
      let speed1 = 232; // in km/h
      let acceleration1 = 1; // in m/s^2

      let hash1 = web3.eth.abi.encodeParameters(
        [
          "uint256",
          "address",
          "uint8",
          "uint256",
          "int32",
          "int32",
          "uint16",
          "uint16",
          "int8"
        ],
        [
          channelId,
          car1,
          status1,
          nonce1,
          latitude1,
          longitude1,
          direction1,
          speed1,
          acceleration1
        ]
      );
      let hashKeccak1 = web3.utils.keccak256(hash1);

      let sig1 = await web3.eth.accounts.sign(
        hashKeccak1,
        "0x31a7e5c9ee676f39b66c8ca4e2b18c259fc1e93a38e52d62468c3a67041b4215" // private key car2
      );

      await channel1n1.closeChannel(
        channelId,
        sig1.signature,
        status1,
        nonce1,
        latitude1,
        longitude1,
        direction1,
        speed1,
        acceleration1,
        { from: car1 }
      );

      // parameters car2
      let status2 = 3; // enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }
      let nonce2 = 1338;
      let latitude2 = 4815069; // in DD(Decimal Degrees) - xx.xxxxx between 90 and -90
      let longitude2 = 1158020; // in DD(Decimal Degrees) - xx.xxxxx between 180 and -180
      let direction2 = 2; // in degrees
      let speed2 = 75; // in km/h
      let acceleration2 = -1; // in m/s^2

      let hash2 = web3.eth.abi.encodeParameters(
        [
          "uint256",
          "address",
          "uint8",
          "uint256",
          "int32",
          "int32",
          "uint16",
          "uint16",
          "int8"
        ],
        [
          channelId,
          car2,
          status2,
          nonce2,
          latitude2,
          longitude2,
          direction2,
          speed2,
          acceleration2
        ]
      );
      let hashKeccak2 = web3.utils.keccak256(hash2);

      let sig2 = await web3.eth.accounts.sign(
        hashKeccak2,
        "0x67a769636fd37e648890dd4f2c85c7a146cb9325e1d32eba80763ef01f44ae98" // private key car1
      );

      let result = await channel1n1.closeChannel(
        channelId,
        sig2.signature,
        status2,
        nonce2,
        latitude2,
        longitude2,
        direction2,
        speed2,
        acceleration2,
        { from: car2 }
      );

      truffleAssert.eventEmitted(result, "OnCloseChannel", ev => {
        return ev.channelId == 0 && ev.car == car2 && ev.closed == true;
      });
    });
  });

  describe("NOT Successful Close channel", function() {
    beforeEach(async () => {
      channel1n1 = await Channel1n1.new();
      await channel1n1.openChannel({
        from: car1
      });
      await channel1n1.joinChannel(0, {
        from: car2
      });
    });

    it("reverts with wrong signer", async () => {
      let channelId = 0;

      // parameters car1
      let status = 3; // enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }
      let nonce = 1337;
      let latitude = 4624644; // in DD(Decimal Degrees) - xx.xxxxx between 90 and -90
      let longitude = 1435776; // in DD(Decimal Degrees) - xx.xxxxx between 180 and -180
      let direction = 0; // in degrees
      let speed = 232; // in km/h
      let acceleration = 1; // in m/s^2

      let hash = web3.eth.abi.encodeParameters(
        [
          "uint256",
          "address",
          "uint8",
          "uint256",
          "int32",
          "int32",
          "uint16",
          "uint16",
          "int8"
        ],
        [
          channelId,
          car1,
          status,
          nonce,
          latitude,
          longitude,
          direction,
          speed,
          acceleration
        ]
      );
      let hashKeccak = web3.utils.keccak256(hash);

      let sig = await web3.eth.accounts.sign(
        hashKeccak,
        "0x4b81ff866fc49aac8353f8b89f8add1f5ec7e93c4e17843e2a185420446de975" // private key car3
      );

      await truffleAssert.reverts(
        channel1n1.closeChannel(
          channelId,
          sig.signature,
          status,
          nonce,
          latitude,
          longitude,
          direction,
          speed,
          acceleration,
          { from: car1 }
        ),
        "The signer is incorrect"
      );
    });

    it("reverts with wrong state vector", async () => {
      let channelId = 0;

      // parameters car1
      let status = 3; // enum Status { IDLE, CONNECTING, CONNECTED, RELEASED }
      let nonce = 1337;
      let latitude = 4624644; // in DD(Decimal Degrees) - xx.xxxxx between 90 and -90
      let longitude = 1435776; // in DD(Decimal Degrees) - xx.xxxxx between 180 and -180
      let direction = 0; // in degrees
      let speed = 232; // in km/h
      let speedWRONG = 355;
      let acceleration = 1; // in m/s^2

      let hash = web3.eth.abi.encodeParameters(
        [
          "uint256",
          "address",
          "uint8",
          "uint256",
          "int32",
          "int32",
          "uint16",
          "uint16",
          "int8"
        ],
        [
          channelId,
          car1,
          status,
          nonce,
          latitude,
          longitude,
          direction,
          speed,
          acceleration
        ]
      );
      let hashKeccak = web3.utils.keccak256(hash);

      let sig = await web3.eth.accounts.sign(
        hashKeccak,
        "0x4b81ff866fc49aac8353f8b89f8add1f5ec7e93c4e17843e2a185420446de975" // private key car3
      );

      await truffleAssert.reverts(
        channel1n1.closeChannel(
          channelId,
          sig.signature,
          status,
          nonce,
          latitude,
          longitude,
          direction,
          speedWRONG,
          acceleration,
          { from: car1 }
        ),
        "The signer is incorrect"
      );
    });
  });
});
