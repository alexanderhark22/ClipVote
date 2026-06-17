// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ClipVote — vote on video clips with real money on ARC
/// @notice A vote is a native USDC micro-payment that goes straight to the
///         creator. Clips are ranked by the dollars backing them, not free
///         likes. Only possible because ARC settles in native USDC — every
///         vote is a stable-value payment in a single transaction.
contract ClipVote {
    struct Clip {
        uint256 id;
        address creator;
        string title;
        string url;
        uint256 backed; // total USDC received (native, 18 decimals)
        uint256 votes;  // number of votes
        uint64 createdAt;
    }

    uint256 public clipCount;
    uint256 public totalBacked;
    uint256 public totalVotes;

    mapping(uint256 => Clip) public clips;
    mapping(address => uint256[]) private _byCreator;
    mapping(address => uint256) public backedByVoter; // a voter's total spend = their conviction

    event ClipSubmitted(uint256 indexed id, address indexed creator, string title, string url);
    event Voted(uint256 indexed id, address indexed voter, address indexed creator, uint256 amount);

    function submitClip(string calldata title, string calldata url) external returns (uint256) {
        require(bytes(title).length > 0 && bytes(title).length <= 100, "bad title");
        require(bytes(url).length > 0 && bytes(url).length <= 300, "bad url");

        uint256 id = ++clipCount;
        clips[id] = Clip(id, msg.sender, title, url, 0, 0, uint64(block.timestamp));
        _byCreator[msg.sender].push(id);
        emit ClipSubmitted(id, msg.sender, title, url);
        return id;
    }

    /// @notice Vote for a clip by sending USDC — it goes straight to the creator.
    function vote(uint256 id) external payable {
        require(msg.value > 0, "send some USDC");
        Clip storage c = clips[id];
        require(c.creator != address(0), "no such clip");
        require(c.creator != msg.sender, "cannot vote your own clip");

        // checks-effects-interactions: update state before paying out
        c.backed += msg.value;
        c.votes += 1;
        totalBacked += msg.value;
        totalVotes += 1;
        backedByVoter[msg.sender] += msg.value;

        (bool ok, ) = payable(c.creator).call{value: msg.value}("");
        require(ok, "payout failed");
        emit Voted(id, msg.sender, c.creator, msg.value);
    }

    function clipsOf(address a) external view returns (uint256[] memory) { return _byCreator[a]; }
    function getClip(uint256 id) external view returns (Clip memory) { return clips[id]; }
}
